import React from 'react';
import {
  withGoogleMap,
  withScriptjs,
  GoogleMap,
  Marker,
} from 'react-google-maps';

import s from './Google.module.scss';

const BasicMap = withScriptjs(withGoogleMap(() =>
  <GoogleMap
    defaultZoom={12}
    defaultCenter={{ lat: parseFloat(-37.813179), lng: parseFloat(144.950259) }}
  >
    <Marker position={{ lat: -37.813179, lng: 144.950259 }} />
  </GoogleMap>,
));

class Maps extends React.Component {

  render() {
    return (
      <div>
        <h1 className={`${s.MapTitle} page-title`}>
          Google <span className="fw-semi-bold">Maps</span>
        </h1>
        <div className={s.MapContainer}>
          <BasicMap
            googleMapURL="https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places&key="
            loadingElement={<div style={{ height: 'inherit', width: 'inherit' }} />}
            containerElement={<div style={{ height: 'inherit' }} />}
            mapElement={<div style={{ height: 'inherit' }} />}
          />
        </div>

      </div>);
  }

}

export default Maps;
