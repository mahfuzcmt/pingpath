import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { colors } from "@/theme";

export interface MapVehicle {
  imei: string;
  lat: number;
  lng: number;
  course: number;
  /** Status color — used for the plate-label pill background. */
  color: string;
  /** Label text shown above the marker (vehicle number). */
  label: string;
  /** Marker silhouette: CAR | MOTORBIKE | TRUCK | BUS | CNG (default CAR). */
  vehicleType?: string | null;
  /** Body tint of the silhouette (device icon color). */
  iconColor?: string | null;
  /** Above the configured SPEED_OVER threshold — red body + blinking marker. */
  overspeed?: boolean;
}

export interface MapPoint {
  lat: number;
  lng: number;
  course?: number;
}

export interface MapCircle {
  lat: number;
  lng: number;
  radiusM: number;
}

interface Props {
  vehicles?: MapVehicle[];
  /** Route polyline as [lng, lat] pairs (trip playback). */
  route?: [number, number][];
  /** Animated marker position during playback. */
  moving?: MapPoint | null;
  /** Center command; bump `nonce` to re-issue the same center. */
  center?: { lat: number; lng: number; zoom?: number; nonce?: number } | null;
  /** Zoom step command (+1 / -1); bump `nonce` to re-issue. */
  zoomStep?: { dir: 1 | -1; nonce: number } | null;
  /** Base layer kind — Normal (street) or Satellite. Default street. */
  baseLayer?: "street" | "satellite";
  /** Circle overlay (geofence preview); null clears it. */
  circle?: MapCircle | null;
  fitRoute?: boolean;
  /** Google live-traffic overlay (only effective on the Google base layer). */
  showTraffic?: boolean;
  /** Reports whether the traffic overlay is available (Google base active). */
  onTrafficAvailable?: (available: boolean) => void;
  onSelect?: (imei: string) => void;
  /** Fires when the user taps empty map (not a marker). */
  onMapPress?: (p: { lat: number; lng: number }) => void;
}

// Bangladesh default view.
const DEFAULT = { lat: 23.685, lng: 90.3563, zoom: 10 };
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

// The WebView page gets this origin (via `baseUrl`) so a referrer-restricted
// Google key works: add https://mobile.pingpath.app/* to the key's allowed
// referrers in Google Cloud Console. Domain doesn't need to exist.
const MAP_REFERRER = "https://mobile.pingpath.app/";

// Leaflet in the WebView, mirroring the web dashboard (frontend/src/lib/leaflet.ts):
// Google Maps base layer via GoogleMutant when a key is configured (OSM misses
// Bangladesh roads/POIs), free OSM tiles otherwise or when Google fails to load.
function buildHtml(googleKey: string): string {
  const googleScripts = googleKey
    ? `<script src="https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(googleKey)}"></script>
<script src="https://unpkg.com/leaflet.gridlayer.googlemutant@0.14.1/dist/Leaflet.GoogleMutant.js"></script>`
    : "";
  return `<!doctype html><html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<link href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" rel="stylesheet"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
${googleScripts}
<style>
  html,body,#map{margin:0;height:100%;width:100%;background:${colors.bg}}
  .vwrap{position:relative;width:40px;height:40px}
  .veh{width:40px;height:40px;cursor:pointer;transform-origin:center}
  .veh svg{display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))}
  .lbl{position:absolute;bottom:calc(100% - 2px);left:50%;transform:translateX(-50%);
       font:700 10px ui-monospace,monospace;color:#fff;letter-spacing:.3px;
       padding:2px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.55);
       box-shadow:0 1px 4px rgba(10,25,40,.35);white-space:nowrap}
  .ovs{animation:mlblink 1s step-start infinite}
  @keyframes mlblink{50%{opacity:.25}}
</style></head><body>
<div id="map"></div>
<script>
  const RN = window.ReactNativeWebView;
  const post = (o) => RN && RN.postMessage(JSON.stringify(o));
  const map = L.map('map', {
    center:[${DEFAULT.lat},${DEFAULT.lng}], zoom:${DEFAULT.zoom},
    zoomControl:false, attributionControl:true
  });
  map.attributionControl.setPrefix(false);

  // Base layer factory — Google (roadmap/hybrid) when the JS API loaded,
  // free OSM / Esri satellite tiles otherwise. Mirrors the web dashboard's
  // createBaseLayer in frontend/src/lib/leaflet.ts.
  let googleOk = false;
  try { googleOk = !!(window.google && window.google.maps && L.gridLayer.googleMutant); } catch(e){}
  function makeBase(kind){
    if(googleOk){
      try {
        return L.gridLayer.googleMutant({type: kind==='satellite'?'hybrid':'roadmap', maxZoom:21});
      } catch(e){}
    }
    return kind==='satellite'
      ? L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {maxZoom:19, attribution:'Tiles &copy; Esri'})
      : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {maxZoom:19, attribution:'&copy; OpenStreetMap'});
  }
  let baseKind = 'street';
  let base = makeBase(baseKind);
  base.addTo(map);

  // Google live-traffic overlay — only exists on the GoogleMutant base layer.
  let traffic = false;
  function applyTraffic(){
    if(!base || !base.addGoogleLayer) return;
    if(traffic) base.addGoogleLayer('TrafficLayer');
    else base.removeGoogleLayer('TrafficLayer');
  }
  // Google key rejected (bad key / referrer) — swap to free tiles so the map still works.
  window.gm_authFailure = function(){
    googleOk = false;
    map.removeLayer(base); base = makeBase(baseKind).addTo(map);
    post({type:'traffic', available:false});
  };

  const markers = {};       // imei -> L.Marker
  let moving = null;         // playback marker
  let route = null;          // trip polyline
  let circle = null;         // geofence preview

  function esc(s){ return String(s==null?'':s).replace(/[<>&]/g,''); }

  // Top-view vehicle silhouettes (24x40, pointing north) — mirrors the web
  // dashboard's frontend/src/lib/vehicleIcons.ts.
  const BODY = {
    CAR: function(c){ return '<rect x="5" y="4" width="14" height="32" rx="5.5" fill="'+c+'" stroke="#0A1928" stroke-width="1.2"/><rect x="7" y="10" width="10" height="6" rx="2" fill="#fff" fill-opacity="0.75"/><rect x="7" y="26" width="10" height="5" rx="2" fill="#fff" fill-opacity="0.45"/>'; },
    MOTORBIKE: function(c){ return '<rect x="9" y="6" width="6" height="28" rx="3" fill="'+c+'" stroke="#0A1928" stroke-width="1.2"/><rect x="4" y="9" width="16" height="2.5" rx="1.2" fill="#0A1928"/><circle cx="12" cy="7" r="2.6" fill="#fff" fill-opacity="0.75"/><rect x="9.5" y="23" width="5" height="7" rx="2" fill="#0A1928" fill-opacity="0.55"/>'; },
    TRUCK: function(c){ return '<rect x="4" y="3" width="16" height="12" rx="3" fill="'+c+'" stroke="#0A1928" stroke-width="1.2"/><rect x="6" y="6" width="12" height="4" rx="1.5" fill="#fff" fill-opacity="0.75"/><rect x="4" y="16" width="16" height="21" rx="2" fill="'+c+'" stroke="#0A1928" stroke-width="1.2"/><line x1="4" y1="26" x2="20" y2="26" stroke="#0A1928" stroke-width="1" stroke-opacity="0.4"/>'; },
    BUS: function(c){ return '<rect x="4.5" y="3" width="15" height="34" rx="4" fill="'+c+'" stroke="#0A1928" stroke-width="1.2"/><rect x="6.5" y="7" width="11" height="4.5" rx="1.5" fill="#fff" fill-opacity="0.75"/><rect x="6.5" y="15" width="11" height="14" rx="1.5" fill="#fff" fill-opacity="0.35"/><rect x="6.5" y="31" width="11" height="3.5" rx="1.5" fill="#fff" fill-opacity="0.5"/>'; },
    CNG: function(c){ return '<path d="M12 4 C16 4 18 7 18 11 L18 31 C18 34.5 15.5 36 12 36 C8.5 36 6 34.5 6 31 L6 11 C6 7 8 4 12 4 Z" fill="'+c+'" stroke="#0A1928" stroke-width="1.2"/><path d="M8.5 9 Q12 6.5 15.5 9 L15.5 13 L8.5 13 Z" fill="#fff" fill-opacity="0.75"/><rect x="8.5" y="27" width="7" height="6" rx="2" fill="#0A1928" fill-opacity="0.45"/>'; }
  };
  function vehHtml(v){
    const body = (BODY[v.vehicleType]||BODY.CAR)(v.overspeed ? '#DC2626' : (v.iconColor||'#E8900A'));
    return '<div class="vwrap'+(v.overspeed?' ovs':'')+'">'
      + (v.label ? '<div class="lbl" style="background:'+(v.color||'#0F2742')+'">'+esc(v.label)+'</div>' : '')
      + '<div class="veh" style="transform:rotate('+(v.course||0)+'deg)">'
      + '<svg width="40" height="40" viewBox="0 0 40 40"><g transform="translate(8 0)">'+body+'</g></svg>'
      + '</div></div>';
  }
  function vehIcon(v){
    return L.divIcon({className:'', iconSize:[40,40], iconAnchor:[20,20], html: vehHtml(v)});
  }
  function vehSig(v){ return [v.vehicleType,v.iconColor,v.color,v.label,v.overspeed?1:0].join('|'); }

  // Playback marker keeps the plain arrow (it marks a route position, not a vehicle).
  function arrowIcon(color, course){
    return L.divIcon({className:'', iconSize:[26,26], iconAnchor:[13,13],
      html: '<div class="veh" style="width:26px;height:26px;transform:rotate('+(course||0)+'deg)">'
        + '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M12 2 L19 21 L12 16 L5 21 Z" fill="'+color+'" stroke="#0A1928" stroke-width="1.2"/></svg>'
        + '</div>'});
  }
  function rotate(marker, course){
    const el = marker.getElement() && marker.getElement().querySelector('.veh');
    if(el) el.style.transform = 'rotate('+(course||0)+'deg)';
  }

  window.MLMap = {
    setVehicles(list){
      const seen = {};
      list.forEach(v => {
        seen[v.imei]=1;
        const m = markers[v.imei];
        if(m){
          m.setLatLng([v.lat,v.lng]);
          if(m._mlSig !== vehSig(v)){ m.setIcon(vehIcon(v)); m._mlSig = vehSig(v); }
          rotate(m, v.course);
        } else {
          const nm = L.marker([v.lat,v.lng], {icon: vehIcon(v)});
          nm._mlSig = vehSig(v);
          nm.on('click', () => post({type:'select', imei:v.imei}));
          nm.addTo(map);
          markers[v.imei] = nm;
        }
      });
      Object.keys(markers).forEach(imei => {
        if(!seen[imei]){ markers[imei].remove(); delete markers[imei]; }
      });
    },
    setTraffic(on){ traffic = !!on; applyTraffic(); },
    setRoute(coords){
      const latlngs = coords.map(c => [c[1], c[0]]);   // [lng,lat] -> [lat,lng]
      if(route){ route.setLatLngs(latlngs); }
      else { route = L.polyline(latlngs, {color:'${colors.brand}', weight:4, opacity:0.9}).addTo(map); }
    },
    setMoving(pt){
      if(!pt){ if(moving){moving.remove(); moving=null;} return; }
      if(moving){ moving.setLatLng([pt.lat,pt.lng]); rotate(moving, pt.course); }
      else { moving = L.marker([pt.lat,pt.lng],
               {icon: arrowIcon('#fff', pt.course||0, ''), interactive:false}).addTo(map); }
    },
    setCircle(c){
      if(!c){ if(circle){circle.remove(); circle=null;} return; }
      if(circle){ circle.setLatLng([c.lat,c.lng]); circle.setRadius(c.radiusM); }
      else {
        circle = L.circle([c.lat,c.lng], {radius:c.radiusM,
          color:'${colors.brand}', weight:2, fillColor:'${colors.brand}', fillOpacity:0.15}).addTo(map);
      }
    },
    center(lat,lng,zoom){ map.flyTo([lat,lng], zoom||14, {duration:0.8}); },
    zoomBy(d){ map.setZoom(map.getZoom()+d); },
    setBase(kind){
      if(kind === baseKind) return;
      baseKind = kind;
      map.removeLayer(base);
      base = makeBase(kind).addTo(map);
      applyTraffic();
      post({type:'traffic', available: !!(base && base.addGoogleLayer)});
    },
    fit(coords){
      if(!coords.length) return;
      const b = L.latLngBounds(coords.map(c => [c[1], c[0]]));
      map.fitBounds(b, {padding:[60,60], maxZoom:15});
    }
  };
  map.on('click', (e) => post({type:'mapclick', lat:e.latlng.lat, lng:e.latlng.lng}));
  map.whenReady(() => post({type:'ready', google: !!(base && base.addGoogleLayer)}));
</script></body></html>`;
}

export default function WebMap({
  vehicles,
  route,
  moving,
  center,
  zoomStep,
  baseLayer,
  circle,
  fitRoute,
  showTraffic,
  onTrafficAvailable,
  onSelect,
  onMapPress,
}: Props) {
  const ref = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  // Commands issued before the map's 'ready' message are queued, not dropped.
  const pending = useRef<string[]>([]);

  const run = useCallback(
    (js: string) => {
      if (ready) ref.current?.injectJavaScript(js + ";true;");
      else pending.current.push(js);
    },
    [ready],
  );

  useEffect(() => {
    if (ready && pending.current.length > 0) {
      const queued = pending.current;
      pending.current = [];
      queued.forEach((js) => ref.current?.injectJavaScript(js + ";true;"));
    }
  }, [ready]);

  useEffect(() => {
    if (vehicles) run(`window.MLMap.setVehicles(${JSON.stringify(vehicles)})`);
  }, [vehicles, run]);

  useEffect(() => {
    if (route) {
      run(`window.MLMap.setRoute(${JSON.stringify(route)})`);
      if (fitRoute) run(`window.MLMap.fit(${JSON.stringify(route)})`);
    }
  }, [route, fitRoute, run]);

  useEffect(() => {
    run(`window.MLMap.setMoving(${JSON.stringify(moving ?? null)})`);
  }, [moving, run]);

  useEffect(() => {
    if (center) run(`window.MLMap.center(${center.lat},${center.lng},${center.zoom ?? 14})`);
  }, [center, run]);

  useEffect(() => {
    if (zoomStep) run(`window.MLMap.zoomBy(${zoomStep.dir})`);
  }, [zoomStep, run]);

  useEffect(() => {
    if (baseLayer) run(`window.MLMap.setBase(${JSON.stringify(baseLayer)})`);
  }, [baseLayer, run]);

  useEffect(() => {
    if (circle !== undefined) run(`window.MLMap.setCircle(${JSON.stringify(circle ?? null)})`);
  }, [circle, run]);

  useEffect(() => {
    if (showTraffic !== undefined) run(`window.MLMap.setTraffic(${showTraffic ? "true" : "false"})`);
  }, [showTraffic, run]);

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(e.nativeEvent.data) as {
          type: string;
          imei?: string;
          lat?: number;
          lng?: number;
          google?: boolean;
          available?: boolean;
        };
        if (msg.type === "ready") {
          setReady(true);
          onTrafficAvailable?.(msg.google === true);
        } else if (msg.type === "traffic") {
          onTrafficAvailable?.(msg.available === true);
        } else if (msg.type === "select" && msg.imei) onSelect?.(msg.imei);
        else if (msg.type === "mapclick" && msg.lat != null && msg.lng != null) {
          onMapPress?.({ lat: msg.lat, lng: msg.lng });
        }
      } catch {
        /* ignore */
      }
    },
    [onSelect, onMapPress, onTrafficAvailable],
  );

  return (
    <View style={styles.fill}>
      <WebView
        ref={ref}
        style={styles.fill}
        originWhitelist={["*"]}
        source={{ html: buildHtml(GOOGLE_MAPS_API_KEY), baseUrl: MAP_REFERRER }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1, backgroundColor: colors.bg } });
