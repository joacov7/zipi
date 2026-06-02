import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getSocket } from '../../lib/socket';
import { SocketEvent } from '@zipi/shared';

// Fix leaflet default icons (broken with bundlers)
import 'leaflet/dist/leaflet.css';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const originIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const destIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const carIcon = new L.DivIcon({
  html: `<div style="font-size:28px;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.3))">🚗</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(L.latLngBounds(positions), { padding: [50, 50] });
    } else if (positions.length === 1) {
      map.setView(positions[0], 15);
    }
  }, [map, positions]);
  return null;
}

interface Props {
  originLat: number;
  originLng: number;
  originAddress: string;
  destLat: number;
  destLng: number;
  destAddress: string;
  driverId?: string;
  driverInitialLat?: number;
  driverInitialLng?: number;
  driverName?: string;
  tripStatus: string;
}

export default function TripMap({
  originLat, originLng, originAddress,
  destLat, destLng, destAddress,
  driverId, driverInitialLat, driverInitialLng, driverName,
  tripStatus,
}: Props) {
  const [driverPos, setDriverPos] = useState<[number, number] | null>(
    driverInitialLat && driverInitialLng ? [driverInitialLat, driverInitialLng] : null,
  );
  const watchingRef = useRef(false);

  useEffect(() => {
    if (!driverId || !['ACCEPTED', 'IN_PROGRESS'].includes(tripStatus)) return;
    if (watchingRef.current) return;

    const socket = getSocket();
    socket.emit('watch:driver', { driverId });
    watchingRef.current = true;

    socket.on(SocketEvent.LOCATION_UPDATE, (data: { driverId: string; lat: number; lng: number }) => {
      if (data.driverId === driverId) {
        setDriverPos([data.lat, data.lng]);
      }
    });

    return () => {
      socket.emit('unwatch:driver', { driverId });
      socket.off(SocketEvent.LOCATION_UPDATE);
      watchingRef.current = false;
    };
  }, [driverId, tripStatus]);

  const positions: [number, number][] = [
    [originLat, originLng],
    ...(destLat && destLng ? [[destLat, destLng] as [number, number]] : []),
    ...(driverPos ? [driverPos] : []),
  ];

  const center: [number, number] = [originLat || -34.6037, originLng || -58.3816];

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 260 }}>
      <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />
        <FitBounds positions={positions} />

        <Marker position={[originLat, originLng]} icon={originIcon}>
          <Popup>{originAddress || 'Origen'}</Popup>
        </Marker>

        {destLat !== 0 && destLng !== 0 && (
          <Marker position={[destLat, destLng]} icon={destIcon}>
            <Popup>{destAddress || 'Destino'}</Popup>
          </Marker>
        )}

        {driverPos && (
          <Marker position={driverPos} icon={carIcon}>
            <Popup>{driverName || 'Conductor'}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
