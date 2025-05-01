// src/pages/AdminDangerMapPage.js
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import styles from './AdminPage.module.css';
import { Link } from 'react-router-dom';

/* global naver */
const AdminDangerMapPage = () => {
  const mapRef = useRef(null);
  const [paths, setPaths] = useState([]);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/complaintsmap');
        const updatedPaths = [];

        for (const path of res.data) {
          if (!path.route_coords) {
            try {
              const registerRes = await axios.post('http://localhost:3001/api/router/register', {
                start_lat: path.start_lat,
                start_lng: path.start_lng,
                end_lat: path.end_lat,
                end_lng: path.end_lng,
              });

              if (registerRes.data.success) {
                updatedPaths.push({
                  ...path,
                  route_coords: JSON.stringify(registerRes.data.route_coords),
                });
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

    // ✅ InfoWindow 전역 하나 생성
    const infoWindow = new naver.maps.InfoWindow();

    // ✅ 지도 클릭 시 InfoWindow 닫기
    naver.maps.Event.addListener(map, 'click', () => {
      infoWindow.close();
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
        strokeOpacity: 1,
        strokeStyle: 'solid',
        clickable: true,
        zIndex: 999,
        map: map,
      });


      naver.maps.Event.addListener(polyline, 'click', (e) => {
        infoWindow.setContent(
          `<div style="padding:10px;font-size:14px;max-width:200px;">
            ⚠️ <strong>위험 사유</strong><br />
            ${path.reason || '내용 없음'}
          </div>`
        );
        infoWindow.open(map, e.coord);
      });
    });
  }, [paths]);

  return (
    <div className={styles['admin-wrapper']}>
      <div className={styles['admin-container']}>
        {/* 🔹 왼쪽 상단으로 버튼 이동 */}
        <div className={styles['admin-button-top-left']}>
          <Link to="/admin" className={styles['admin-link-button']}>
            ← 관리자 페이지로
          </Link>
        </div>

        {/* 🔹 제목은 그 아래에 위치 */}
        <h1 className={styles['admin-title']} style={{ fontSize: '1.8rem' }}>
          🧭 위험 구간 지도 페이지
        </h1>

        {/* 지도 */}
        <div style={{ height: '500px', marginTop: '30px' }}>
          <h2 style={{ padding: '10px 0' }}>🚧 민원 기반 위험 경로 시각화</h2>
          <div
            ref={mapRef}
            style={{
              width: '100%',
              height: '100%',
              border: '1px solid #ccc',
            }}
          />
        </div>

        {/* ✅ reason 리스트 출력 */}
        <div style={{ marginTop: '40px' }}>
          <h2 style={{ margin: '30px 0 10px 0' }}>📝 경로 기반 민원 내용</h2>
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {paths.map((item, idx) => (
              <li key={idx} style={{
                borderBottom: '1px solid #eee',
                padding: '10px 0',
                color: '#333',
                fontSize: '14px'
              }}>
                {item.reason || '내용 없음'}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDangerMapPage;
