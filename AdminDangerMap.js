import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

/* global naver */
const AdminDangerMap = () => {
  const mapRef = useRef(null);
  const [paths, setPaths] = useState([]);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/complaintsmap');
        const updatedPaths = [];

        for (const path of res.data) {
          // route_coords가 없으면 API 호출로 갱신 시도
          if (!path.route_coords) {
            try {
              const registerRes = await axios.post('http://localhost:3001/api/router/register', {
                start_lat: path.start_lat,
                start_lng: path.start_lng,
                end_lat: path.end_lat,
                end_lng: path.end_lng,
              });

              if (registerRes.data.success) {
                updatedPaths.push({ ...path, route_coords: JSON.stringify(registerRes.data.route_coords) });
              } else {
                console.warn('❌ 경로 등록 실패:', registerRes.data.message);
              }
            } catch (err) {
              console.error('❌ 경로 등록 에러:', err);
            }
          } else {
            updatedPaths.push(path);
          }
        }

        setPaths(updatedPaths);
      } catch (err) {
        console.error('❌ 경로 데이터 불러오기 실패:', err);
      }
    };

    fetchRoutes();
  }, []);

  useEffect(() => {
    if (!window.naver || !paths.length || !mapRef.current) return;

    const map = new naver.maps.Map(mapRef.current, {
      center: new naver.maps.LatLng(35.854, 128.486),
      zoom: 14,
    });

    paths.forEach((path) => {
      let coords = [];

      try {
        coords = JSON.parse(path.route_coords);
      } catch (e) {
        console.warn('⚠️ 좌표 파싱 실패:', e);
        return;
      }

      const latlngs = coords.map(([lng, lat]) => new naver.maps.LatLng(lat, lng));

      const polyline = new naver.maps.Polyline({
        path: latlngs,
        strokeColor: '#f43f5e',
        strokeWeight: 5,
        strokeOpacity: 0.7,
        map: map,
      });

      naver.maps.Event.addListener(polyline, 'click', () => {
        alert(`📍 위험도 추정: ${latlngs.length}점`);
      });
    });
  }, [paths]);

  return (
    <div style={{ height: '500px', marginTop: '40px' }}>
      <h2 style={{ padding: '10px 0' }}>🧭 위험구간 시각화</h2>
      <div
        ref={mapRef}
        style={{ width: '100%', height: '100%', border: '1px solid #ccc' }}
      />
    </div>
  );
};

export default AdminDangerMap;
