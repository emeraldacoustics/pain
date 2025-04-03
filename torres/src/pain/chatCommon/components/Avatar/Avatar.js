import React, { PureComponent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import s from './Avatar.module.scss';

class Avatar extends PureComponent {

  initials = (user) => {
    return `${user?.first_name?.charAt(0).toUpperCase()}${user?.last_name?.charAt(0).toUpperCase()}`;
  }

  render() {
    const { user, size, showStatus, group, stroke, classProp } = this.props;
    return (
    <>
      {user && (
      !group ? 
        <div className={`${s.avatar} ${classProp ? classProp : ""}`} style={{
          height: size + 'px',
          width: size + 'px',
          minWidth: size + 'px',
          }}
        >
          <div className={`${s.imageWrapper} ${stroke ? s.stroke : ''}`} style={{
            fontSize: size / 3 + 'px'
          }}>
            {false && user.avatar ? 
              <img src={user.avatar} alt="user avatar"/>
            : <span>{this.initials(user)}</span>}
            
          </div>
          {(user.isOnline && showStatus) ? 
            <span className={`${s.status} bg-success`}></span>
          :null}
          
      </div>      
      
      : (
        <div className={s.sharedDialog}>
          {user.avatar.map(img => (
          <div className={s.imgWrap} key={uuidv4()}>
            <img src={img} alt="alt"/>
          </div>
          ))}
        </div>
      )
     )}
    </>
    )
  }
}

export default Avatar
