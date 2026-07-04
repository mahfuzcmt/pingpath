import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { colors } from "@/theme";

export interface MapVehicle {
  imei: string;
  lat: number;
  lng: number;
  course: number;
  color: string;
  label: string;
}

export interface MapPoint {
  lat: number;
  lng: number;
  course?: number;
}

interface Props {
  vehicles?: MapVehicle[];
  /** Route polyline as [lng, lat] pairs (trip playback). */
  route?: [number, number][];
  /** Animated marker position during playback. */
  moving?: MapPoint | null;
  /** Center command; bump `nonce` to re-issue the same center. */
  center?: { lat: number; lng: number; zoom?: number; nonce?: number } | null;
  fitRoute?: boolean;
  onSelect?: (imei: string) => void;
}

// Bangladesh default view.
const DEFAULT = { lat: 23.685, lng: 90.3563, zoom: 6.3 };
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";

function buildHtml(token: string): string {
  return `<!doctype html><html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<link href="https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.css" rel="stylesheet"/>
<script src="https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.js"></script>
<style>
  html,body,#map{margin:0;height:100%;width:100%;background:${colors.bg}}
  .veh{width:26px;height:26px;cursor:pointer;transform-origin:center}
  .veh svg{display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))}
  .lbl{font:600 10px system-ui;color:#fff;background:rgba(15,39,66,.85);
       padding:1px 5px;border-radius:6px;transform:translateY(-4px);white-space:nowrap}
</style></head><body>
<div id="map"></div>
<script>
  const RN = window.ReactNativeWebView;
  const post = (o) => RN && RN.postMessage(JSON.stringify(o));
  mapboxgl.accessToken = ${JSON.stringify(token)};
  const map = new mapboxgl.Map({
    container:'map', style:'mapbox://styles/mapbox/dark-v11',
    center:[${DEFAULT.lng},${DEFAULT.lat}], zoom:${DEFAULT.zoom}, attributionControl:false
  });
  const markers = {};       // imei -> mapboxgl.Marker
  let moving = null;         // playback marker

  function arrowEl(color, course, label){
    const wrap = document.createElement('div');
    const a = document.createElement('div');
    a.className='veh';
    a.style.transform='rotate('+(course||0)+'deg)';
    a.innerHTML='<svg width="26" height="26" viewBox="0 0 24 24"><path d="M12 2 L19 21 L12 16 L5 21 Z" fill="'+color+'" stroke="#0A1928" stroke-width="1.2"/></svg>';
    wrap.appendChild(a);
    if(label){ const l=document.createElement('div'); l.className='lbl'; l.textContent=label; wrap.appendChild(l); }
    return wrap;
  }

  window.MLMap = {
    setVehicles(list){
      const seen = {};
      list.forEach(v => {
        seen[v.imei]=1;
        if(markers[v.imei]){
          markers[v.imei].setLngLat([v.lng,v.lat]);
          const el = markers[v.imei].getElement().querySelector('.veh');
          if(el) el.style.transform='rotate('+(v.course||0)+'deg)';
        } else {
          const el = arrowEl(v.color, v.course, v.label);
          el.addEventListener('click', () => post({type:'select', imei:v.imei}));
          markers[v.imei] = new mapboxgl.Marker({element:el, anchor:'center'})
            .setLngLat([v.lng,v.lat]).addTo(map);
        }
      });
      Object.keys(markers).forEach(imei => {
        if(!seen[imei]){ markers[imei].remove(); delete markers[imei]; }
      });
    },
    setRoute(coords){
      const data = { type:'Feature', geometry:{ type:'LineString', coordinates:coords } };
      if(map.getSource('route')) { map.getSource('route').setData(data); }
      else {
        map.addSource('route',{type:'geojson',data});
        map.addLayer({id:'route',type:'line',source:'route',
          paint:{'line-color':'${colors.brand}','line-width':4,'line-opacity':0.9}});
      }
    },
    setMoving(pt){
      if(!pt){ if(moving){moving.remove(); moving=null;} return; }
      if(moving){ moving.setLngLat([pt.lng,pt.lat]); }
      else { moving = new mapboxgl.Marker({element:arrowEl('#fff', pt.course||0,''),anchor:'center'})
               .setLngLat([pt.lng,pt.lat]).addTo(map); }
      const el = moving.getElement().querySelector('.veh');
      if(el) el.style.transform='rotate('+(pt.course||0)+'deg)';
    },
    center(lat,lng,zoom){ map.flyTo({center:[lng,lat], zoom: zoom||14, duration:800}); },
    fit(coords){
      if(!coords.length) return;
      const b = coords.reduce((bb,c)=>bb.extend(c), new mapboxgl.LngLatBounds(coords[0],coords[0]));
      map.fitBounds(b,{padding:60, duration:600, maxZoom:15});
    }
  };
  map.on('load', () => post({type:'ready'}));
</script></body></html>`;
}

export default function WebMap({
  vehicles,
  route,
  moving,
  center,
  fitRoute,
  onSelect,
}: Props) {
  const ref = useRef<WebView>(null);
  const [ready, setReady] = useState(false);

  const run = useCallback(
    (js: string) => {
      if (ready) ref.current?.injectJavaScript(js + ";true;");
    },
    [ready],
  );

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

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(e.nativeEvent.data) as { type: string; imei?: string };
        if (msg.type === "ready") setReady(true);
        else if (msg.type === "select" && msg.imei) onSelect?.(msg.imei);
      } catch {
        /* ignore */
      }
    },
    [onSelect],
  );

  return (
    <View style={styles.fill}>
      <WebView
        ref={ref}
        style={styles.fill}
        originWhitelist={["*"]}
        source={{ html: buildHtml(MAPBOX_TOKEN) }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1, backgroundColor: colors.bg } });
