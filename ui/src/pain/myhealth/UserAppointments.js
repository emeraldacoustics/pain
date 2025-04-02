import React, { Component } from 'react';
import { Button } from 'reactstrap'; 
import { push } from 'connected-react-router';
import { connect } from 'react-redux';
import { Col, Row } from 'reactstrap';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { TabContent, TabPane } from 'reactstrap';
import cx from 'classnames';
import classnames from 'classnames';
import s from './default.module.scss';
import translate from '../utils/translate';
import AppSpinner from '../utils/Spinner';
import Appointment from '../myhealth/Appointment.js';
import AliceCarousel from 'react-alice-carousel';
import { createRoom,clearRoom } from '../../actions/createRoom';

class UserAppointments extends Component {
    constructor(props) { 
        super(props);
        this.state = { 
            sent: false,
            selected: null
        }
        this.onNewChat = this.onNewChat.bind(this);
        this.viewAppointment = this.viewAppointment.bind(this);
        this.cancel = this.cancel.bind(this);
    } 

    componentWillReceiveProps(p) { 
        if (p.createRoom && p.createRoom.data && p.createRoom.data.success && !this.state.sent) { 
            this.props.dispatch(push('/app/main/myhealth/chat'))
            this.props.dispatch(clearRoom());
            this.setState(this.state);
        } 
    }

    componentDidMount() {
    }
    viewAppointment(e) { 
        this.state.selected = e;
        this.setState(this.state);
        
    } 
    cancel() { 
        this.state.selected = null;
        this.setState(this.state);
    } 
    onNewChat(e) { 
        var params = {
            to:e.phy_id,
            appt_id:e.schedule_id
        }
        this.props.dispatch(createRoom(params));
        this.state.sent = false;
        this.setState(this.state);
    }

    render() {
        const responsive = {
            0: { 
                items: 1
            },
            568: { 
                items: 1
            },
            1024: {
                items: 2, 
                itemsFit: 'contain'
            },
        };
        return (
        <>
            {(this.props.createRoom && this.props.createRoom.isReceiving) && (
                <AppSpinner/>
            )}
            <Row md="12">
                {(this.state.selected !== null) && ( 
                    <Col md="6">
                    <h3>Detail</h3>
                    </Col>
                )}
                {(this.state.selected === null) && ( 
                    <Col md="6">
                    <h3>Appointments</h3>
                    </Col>
                )}
            </Row>
            <Row md="12">
                <>
                {(this.props.user && this.props.user.data && this.props.user.data.appt && 
                  this.props.user.data.appt.length > 0 && this.state.selected === null) && (
                    <>
                    {this.props.user.data.appt.sort((a,b) => (a.created > b.created ? -1:1)).map((e) => {
                        return (
                        <Col md={window.innerWidth <= 1024 ? "8" : "6"}>
                            <Appointment viewAppt={true} onViewAppt={() => this.viewAppointment(e)} 
                                onNewChat={() => this.onNewChat(e)} chat={true} data={e}/>
                        </Col>
                        )
                    })}
                    </>
                )}
                {/*<AliceCarousel animationType="fadeout" animationDuration={3}
                    autoPlay={false} disableDotsControls={true} infinite={false}
                    disableButtonsControls={false} responsive={responsive}
                    disableSlideInfo={false}
                    mouseTracking items={this.props.user.data.appt.sort((a,b) => (a.created > b.created ? 1:-1)).map((e) => { 
                        return (
                            <Col md="12">
                                <Appointment chat={true} data={e}/>
                            </Col>                
                        )
                        })}
                    />
                    </>
                )*/}
                {(this.props.user && this.props.user.data && this.props.user.data.appt && 
                  this.props.user.data.appt.length < 1 && this.state.selected === null) && (
                    <Col md="12">
                        <div>
                            <h4>No appointments scheduled</h4>
                        </div>
                    </Col>
                )}
                {(this.props.user && this.props.user.data && this.props.user.data.appt && 
                  this.props.user.data.appt.length > 1 && this.state.selected !== null) && (
                    <Col md="12">
                        <Row md="12">
                            <Col md="6">
                                <Row md="12">
                                    <Col md="3">
                                        detail here
                                    </Col>
                                </Row>
                            </Col>
                            <Col md="6">
                                stuff here
                            </Col>
                        </Row>
                        <hr/>
                        <Row md="12">
                            <Col md="3">
                                <Button outline style={{marginLeft:0}} onClick={this.cancel} color="secondary">Cancel</Button>
                            </Col>
                        </Row>
                    </Col>
                )}
                </>
            </Row>
        </>
        )
    }
}

function mapStateToProps(store) {
    return {
        currentUser: store.auth.currentUser,
        user: store.user,
        createRoom: store.createRoom
    }
}

export default connect(mapStateToProps)(UserAppointments);
