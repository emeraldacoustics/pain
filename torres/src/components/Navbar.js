import React ,  { Component } from "react";
import MenuIcon from '@mui/icons-material/Menu';
import { connect } from 'react-redux';
import DropdownMenu from './DropdownMenu';
import { logoutUser } from '../actions/auth';
import { delContext } from '../actions/delContext';
import { locationUpdate } from '../actions/location';
import { getNotifications }  from '../actions/adminNotifications';
import NotificationsMenu from './NotificationsMenu';
import siteType from '../siteType';

class Navbar extends Component {

    constructor(props) { 
        super(props);
        this.state = { 
            mylocation: null,
            prevlocation: null,
            delay:60000,
            geo: false,
        } 
        this.logout = this.logout.bind(this);
        this.getNotifications = this.getNotifications.bind(this);
        this.leaveContext = this.leaveContext.bind(this);
        this.setLocation = this.setLocation.bind(this);
        this.sendLocation = this.sendLocation.bind(this);
    } 

    componentDidMount() { 
        this.getNotifications();
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                this.setLocation(position.coords.latitude, position.coords.longitude);
            }, this.getWithoutPermission);
        } else {
            this.setState({ geo: false });
        }
        setTimeout((e) => { e.sendLocation() }, this.state.delay, this)
    }
    
    doLogin() {  
        window.location = '/login';
    } 

    setLocation = (lat, lon) => {
        this.setState({ geo:true, mylocation: { lat, lon } });
    };

    getWithoutPermission = () => {
        this.setState({ geo: false });
    };

    sendLocation() { 
        setTimeout((e) => { e.sendLocation() }, this.state.delay, this)
        if (!this.state.geo) { return; } 
        if (!this.props.currentUser) { return; }
        if (this.state.prevlocation && 
            this.state.prevlocation.lat === this.state.mylocation.lat &&
            this.state.prevlocation.lon === this.state.mylocation.lon) { 
            return;
        }  
        this.state.prevlocation = this.state.mylocation;
        this.props.dispatch(locationUpdate(this.state.mylocation));
        this.setState(this.state);
    } 

    getNotifications() { 
        setTimeout((e) => { e.getNotifications() }, 300000, this)
        if (!this.props.currentUser) { return; }
        if (!this.props.currentUser.entitlements) { return; }
        if (!this.props.currentUser.entitlements.includes("Admin")) { return; }
        this.props.dispatch(getNotifications());
    } 

    logout() { 
        this.props.dispatch(logoutUser());
    } 

    leaveContext() { 
        this.props.dispatch(delContext({},function(err,args) { 
            localStorage.removeItem("context");
            window.location.href = '/app';
        }));
    } 

    render(){
        const mainMenuItems = [
            {
             n:'Home',
             v:function(c) { 
                return true;
             },
             a:function() { 
                window.location = '/';
             }
            },
            {
             n:'Login',
             v:function(c) { 
                return true;
             },
             a:function() { 
                window.location = '/login';
             }
            },
        ];
        const patientMenuItems = [
            {
             n:'Home',
             v:function(c) { 
                return true;
             },
             a:function() { 
                window.location = '/';
             }
            },
            {
             n:'Login',
             v:function(c) { 
                return true;
             },
             a:function() { 
                window.location = '/login';
             }
            },
        ];
        const mobileMainItems = [
            {
             n:'Home',
             v:function(c) { 
                return true;
             },
             a:function() { 
                window.location = '/app/main/view/incidentmap';
             }
            },
            {
             n:'Login',
             v:function(c) { 
                return true;
             },
             a:function() { 
                window.location = '/login';
             }
            },
        ];
        const mobileInvestorItems = [
            {
             n:'Home',
             v:function(c) { 
                return true;
             },
             a:function() { 
                window.location = '/app/main/view/incidentmap';
             }
            },
            {n:'Logout',
             a:this.logout,
             v:function(c) { return true; },
             u:'/'  
            },
        ];
        const anonymousMenuItems= [
            {
             n:'Home',
             v:function(c) { 
                return true;
             },
             a:function() { 
                window.location = '/';
             }
            },
            {
             n:'About',
             v:function(c) { 
                return true;
             },
             a:function() { 
                window.location = '/#about';
             }
            },
            {
             n:'Pricing',
             v:function(c) { 
                return true;
             },
             a:function() { 
                window.location = '/#pricing';
             }
            },
            {
             n:'Support',
             v:function(c) { 
                return (c.entitlements.includes('SupportUser') ? true : false)
             },
             a:function() { 
                window.location = '/#support';
             }
            },
            {
             n:'Login',
             v:function(c) { 
                return true;
             },
             a:function() { 
                window.location = '/login';
             }
            },
        ]
        const mobileAdminItems= [
            {
             n:'Home',
             v:function(c) { 
                return true;
             },
             a:function() { 
                window.location = '/app';
             }
            },
            {
             n:'Map',
             v:function(c) { 
                return true;
             },
             a:function() { 
                window.location = '/app/main/admin/map';
             }
            },
            {
             n:'CRM',
             v:function(c) { 
                return true;
             },
             a:function() { 
                window.location = '/app/main/admin/crm';
             }
            },
            {
             n:'Investors',
             v:function(c) { 
                return true;
             },
             a:function() { 
                window.location = '/app/main/admin/investors';
             }
            },
            {n:'Logout',
             a:this.logout,
             v:function(c) { return true; },
             u:'/'  
            },
        ]
        const profileItems = [
            {n:'Leave Context',
             v:function(c) { 
                return (c.context ? true : false)
             },
             a:this.leaveContext,
             u:'/'
            },
            {n:'Logout',
             a:this.logout,
             v:function(c) { return true; },
             u:'/'  
            },
        ]
        const systemItems = [
            {n:'Data Science',
             v:function(c) { 
                return (c.entitlements.includes('DataScience') ? true : false)
             },
             a:function() { 
                window.location = '/app/main/admin/datascience';
             },
             u:'/'
            },
            {
             n:'Investors',
             v:function(c) { 
                return true;
             },
             a:function() { 
                window.location = '/app/main/admin/investors';
             }
            },
            {
             n:'Invoices',
             v:function(c) { 
                return true;
             },
             a:function() { 
                window.location = '/app/main/admin/invoices';
             }
            },
            {
             n:'Commissions',
             v:function(c) { 
                return true;
             },
             a:function() { 
                window.location = '/app/main/admin/commissions';
             }
            },
            {
             n:'Coupons',
             v:function(c) { 
                return true;
             },
             a:function() { 
                window.location = '/app/main/admin/coupons';
             }
            },
            {
             n:'Plans',
             v:function(c) { 
                return true;
             },
             a:function() { 
                window.location = '/app/main/admin/plans';
             }
            },
            {
             n:'Online Demos',
             v:function(c) { 
                return true;
             },
             a:function() { 
                window.location = '/app/main/admin/demos';
             }
            },
            {
             n:'Users',
             v:function(c) { 
                return true;
             },
             a:function() { 
                window.location = '/app/main/admin/users';
             }
            },
        ];
        return(
            <div style={{backgroundColor:'black'}} className="app-header header--transparent sticker" id="main-menu">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-lg-3 col-sm-4 col-4">
                            <div className="logo">
                                <a href='/'>
                                    <img className="logo-1" 
                                        style={{
                                            height:this.props.currentUser !== null ? '100px': '200px',
                                            objectFit:'contain',
                                            width:this.props.currentUser !== null ? '100px': '200px'
                                        }} 
                                        src={require('../assets/images/logo/logo.png')} alt="app landing"/>
                                </a>
                            </div>
                        </div>
                        {(this.props.currentUser && this.props.currentUser.entitlements && 
                            this.props.currentUser.entitlements.includes('CRMUser')) && (
                        <>
                            <div className="col-lg-9 d-none d-lg-block">
                                <div className="mainmenu-wrapper">
                                    <nav>
                                        <ul className="main-menu">
                                            <li className="active"><a href="/app">Home</a></li>
                                            <li><a href="/app/main/admin/crm">CRM</a></li>
                                            {(this.props.currentUser && this.props.currentUser.entitlements && 
                                              this.props.currentUser.entitlements.includes('SupportUser')) && (
                                                <li><a href="/app/main/admin/support">Support</a></li>
                                            )}
                                            <li><a> 
                                                <DropdownMenu currentUser={this.props.currentUser} 
                                                    title={
                                                    this.props.currentUser.first_name + " " + this.props.currentUser.last_name
                                                          } items={profileItems} dispatch={this.props.dispatch}/>
                                                </a>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            </div>
                            <div className="col-sm-9 col-9 d-block d-lg-none">
                                <div className="mobile-menu">
                                    <nav>
                                        <ul>                              
                                            <li className="active"><a href="/app">Home</a></li>
                                            <li><a href="/app/main/admin/crm">CRM</a></li>
                                            {(this.props.currentUser && this.props.currentUser.entitlements && 
                                              this.props.currentUser.entitlements.includes('SupportUser')) && (
                                            <li><a href="/app/main/admin/support">Support</a></li>
                                            )}
                                            <li><a href="#"> // eslint-disable-next-line jsx-a11y/anchor-is-valid
                                                <DropdownMenu currentUser={this.props.currentUser} 
                                                    title={
                                                    this.props.currentUser.first_name + " " + this.props.currentUser.last_name
                                                          } items={profileItems} dispatch={this.props.dispatch}/>
                                                </a>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            </div>
                        </>
                        )}
                        {(this.props.currentUser && this.props.currentUser.entitlements && 
                            this.props.currentUser.entitlements.includes('Customer')) && (
                        <>
                            <div className="col-lg-9 d-none d-lg-block">
                                <div className="mainmenu-wrapper">
                                    <nav>
                                        <ul className="main-menu">
                                            <li className="active"><a href="/app">Home</a></li>
                                            <li><a href="/app/main/client/appointments">Appointments</a></li>
                                            {/*<li><a href="/app/main/client/search">Search</a></li>*/}
                                            <li><a> 
                                                <DropdownMenu currentUser={this.props.currentUser} 
                                                    title={
                                                    this.props.currentUser.first_name + " " + this.props.currentUser.last_name
                                                          } items={profileItems} dispatch={this.props.dispatch}/>
                                                </a>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            </div>
                            <div className="col-sm-9 col-9 d-block d-lg-none">
                                <div className="mobile-menu">
                                    <nav>
                                        <ul>                              
                                            <li className="active"><a href="/app">Home</a></li>
                                            <li><a href="/app/main/client/appointments">Appointments</a></li>
                                            {/*<li><a href="/app/main/client/search">Search</a></li>*/}
                                            <li><a href="#"> // eslint-disable-next-line jsx-a11y/anchor-is-valid
                                                <DropdownMenu currentUser={this.props.currentUser} 
                                                    title={
                                                    this.props.currentUser.first_name + " " + this.props.currentUser.last_name
                                                          } items={profileItems} dispatch={this.props.dispatch}/>
                                                </a>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            </div>
                        </>
                        )}
                        {(this.props.currentUser && this.props.currentUser.entitlements && 
                            this.props.currentUser.entitlements.includes('OfficeAdmin')) && (
                            <>
                            <div className="col-lg-9 d-none d-lg-block">
                                <div className="mainmenu-wrapper">
                                    <nav>
                                        <ul className="main-menu">
                                            <li className="active"><a href="/app">Home</a></li>
                                            <li><a href="/app/main/office/clients">Clients</a></li>
                                            <li><a href="/app/main/office/locations">Locations</a></li>
                                            {/*<li><a href="/app/main/office/profile">Profile</a></li>*/}
                                            {/*<li><a href="/app/main/office/invoices">Invoices</a></li>*/}
                                            <li><a href="#">
                                                <DropdownMenu currentUser={this.props.currentUser} 
                                                    title={
                                                    this.props.currentUser.first_name + " " + this.props.currentUser.last_name
                                                          } items={profileItems} dispatch={this.props.dispatch}/>
                                                </a>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            </div>
                            <div className="col-sm-9 col-9 d-block d-lg-none">
                                <div className="mobile-menu">
                                    <nav>
                                        <ul>                              
                                            <li className="active"><a href="/app">Home</a></li>
                                            <li><a href="/app/main/office/clients">Clients</a></li>
                                            <li><a href="/app/main/admin/locations">Locations</a></li>
                                            {/*<li><a href="/app/main/office/profile">Profile</a></li>*/}
                                            <li><a href="#">
                                                <DropdownMenu currentUser={this.props.currentUser} 
                                                    title={
                                                    this.props.currentUser.first_name + " " + this.props.currentUser.last_name
                                                          } items={profileItems} dispatch={this.props.dispatch}/>
                                                </a>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            </div>
                            </>
                        )}
                        {(this.props.currentUser && this.props.currentUser.entitlements && 
                          this.props.currentUser.entitlements.includes('InvestorView') && !this.props.currentUser.context) && (
                            <>
                            <div className="col-lg-9 d-none d-lg-block">
                                <div className="mainmenu-wrapper">
                                    <nav>
                                        <ul className="main-menu">
                                            <li className="active"><a href="/app/main/view/incidentmap">Incidents</a></li>
                                            <li><a>
                                                <DropdownMenu currentUser={this.props.currentUser} 
                                                    title={
                                                    this.props.currentUser.first_name + " " + this.props.currentUser.last_name
                                                          } items={profileItems} dispatch={this.props.dispatch}/>
                                                </a>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            </div>
                            <div className="col-sm-8 col-8 d-block d-lg-none">
                                <div className="mobile-menu" style={{color:'white'}}>
                                    <div style={{float:"right"}}>
                                    <nav>
                                        <ul className="main-menu">
                                            <li><a>
                                                <DropdownMenu currentUser={this.props.currentUser} 
                                                    title={<MenuIcon/>} items={mobileInvestorItems} dispatch={this.props.dispatch}/>
                                                </a>
                                            </li>
                                        </ul>
                                    </nav>
                                    </div>
                                </div>
                            </div>
                            </>
                        )}
                        {(this.props.currentUser && this.props.currentUser.entitlements && 
                          this.props.currentUser.entitlements.includes('Admin') && !this.props.currentUser.context) && (
                            <>
                            <div className="col-lg-9 d-none d-lg-block">
                                <div className="mainmenu-wrapper">
                                    <nav>
                                        <ul className="main-menu">
                                            <li className="active"><a href="/app">Home</a></li>
                                            <li><a href="/app/main/admin/map">Map</a></li>
                                            <li><a href="/app/main/admin/crm">CRM</a></li>
                                            {(this.props.currentUser && this.props.currentUser.entitlements && 
                                              this.props.currentUser.entitlements.includes('SupportUser')) && (
                                            <li><a href="/app/main/admin/support">Support</a></li>
                                            )}
                                            <li><a>
                                                <DropdownMenu currentUser={this.props.currentUser} 
                                                    title='System' items={systemItems} dispatch={this.props.dispatch}/>
                                                </a>
                                            </li>
                                            <li><a>
                                                <DropdownMenu currentUser={this.props.currentUser} 
                                                    title={
                                                    this.props.currentUser.first_name + " " + this.props.currentUser.last_name
                                                          } items={profileItems} dispatch={this.props.dispatch}/>
                                                </a>
                                            </li>
                                            <li><a>
                                                <NotificationsMenu currentUser={this.props.currentUser} 
                                                          items={this.props.adminNotifications.data.length ? this.props.adminNotifications.data :  []} dispatch={this.props.dispatch}/>
                                                </a>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            </div>
                            <div className="col-sm-8 col-8 d-block d-lg-none">
                                <div className="mobile-menu" style={{color:'white'}}>
                                    <div style={{float:"right"}}>
                                        <DropdownMenu currentUser={this.props.currentUser} 
                                            title={<MenuIcon/>} items={mobileAdminItems} dispatch={this.props.dispatch}/>
                                    </div>
                                </div>
                            </div>
                            </>
                        )}
                        {(!this.props.currentUser && siteType() === "main") && (
                            <>
                            <div className="col-lg-8 d-none d-lg-block">
                                <div className="mainmenu-wrapper">
                                    <nav>
                                        <ul className="main-menu">
                                            <li className="active"><a href="/">Home</a></li>
                                        </ul>
                                    </nav>
                                    <button onClick={this.doLogin} className="button-default button-olive" type="button">Login</button>
                                </div>
                            </div>
                            <div className="col-sm-8 col-8 d-block d-lg-none">
                                <div className="mobile-menu" style={{color:'white'}}>
                                    <div style={{float:"right"}}>
                                            <DropdownMenu currentUser={this.props.currentUser} 
                                                title={<MenuIcon/>} items={mainMenuItems} dispatch={this.props.dispatch}/>
                                    </div>
                                </div>
                            </div>
                            </>
                        )}
                        {(!this.props.currentUser && siteType() === "legal") && (
                            <>
                            <div className="col-lg-8 d-none d-lg-block">
                                <div className="mainmenu-wrapper">
                                    <nav>
                                        <ul className="main-menu">
                                            <li className="active"><a href="/">Home</a></li>
                                            <li><a href="/#about">About</a></li>
                                            <li><a href="/#pricing">Pricing</a></li>
                                            <li><a href="/#support">Support</a></li>
                                        </ul>
                                    </nav>
                                    <button onClick={this.doLogin} className="button-default button-olive" type="button">Login</button>
                                </div>
                            </div>
                            <div className="col-sm-8 col-8 d-block d-lg-none">
                                <div className="mobile-menu" style={{color:'white'}}>
                                    <div style={{float:"right"}}>
                                            <DropdownMenu currentUser={this.props.currentUser} 
                                                title={<MenuIcon/>} items={anonymousMenuItems} dispatch={this.props.dispatch}/>
                                    </div>
                                </div>
                            </div>
                            </>
                        )}
                        {(!this.props.currentUser && siteType() === "patient") && (
                            <>
                            <div className="col-lg-8 d-none d-lg-block">
                                <div className="mainmenu-wrapper">
                                    <nav>
                                        <ul className="main-menu">
                                            <li className="active"><a href="/">Home</a></li>
                                        </ul>
                                    </nav>
                                    <button onClick={this.doLogin} className="button-default button-olive" type="button">Login</button>
                                </div>
                            </div>
                            <div className="col-sm-8 col-8 d-block d-lg-none">
                                <div className="mobile-menu" style={{color:'white'}}>
                                    <div style={{float:"right"}}>
                                            <DropdownMenu currentUser={this.props.currentUser} 
                                                title={<MenuIcon/>} items={patientMenuItems} dispatch={this.props.dispatch}/>
                                    </div>
                                </div>
                            </div>
                            </>
                        )}
                        {(!this.props.currentUser && siteType() === "provider") && (
                            <>
                            <div className="col-lg-8 d-none d-lg-block">
                                <div className="mainmenu-wrapper">
                                    <nav>
                                        <ul className="main-menu">
                                            <li className="active"><a href="/">Home</a></li>
                                            <li><a href="/#about">About</a></li>
                                            <li><a href="/#pricing">Pricing</a></li>
                                            <li><a href="/#support">Support</a></li>
                                        </ul>
                                    </nav>
                                    <button onClick={this.doLogin} className="button-default button-olive" type="button">Login</button>
                                </div>
                            </div>
                            <div className="col-sm-8 col-8 d-block d-lg-none">
                                <div className="mobile-menu" style={{color:'white'}}>
                                    <div style={{float:"right"}}>
                                            <DropdownMenu currentUser={this.props.currentUser} 
                                                title={<MenuIcon/>} items={anonymousMenuItems} dispatch={this.props.dispatch}/>
                                    </div>
                                </div>
                            </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        )
    }
}

function mapStateToProps(store) {
    return {
        currentUser: store.auth.currentUser,
        adminNotifications: store.adminNotifications
    }
}

export default connect(mapStateToProps)(Navbar);
