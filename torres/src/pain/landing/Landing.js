import React, { Component } from 'react';
import { connect } from 'react-redux';
import cx from 'classnames';
import classnames from 'classnames';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import Navbar from '../../components/Navbar';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import translate from '../utils/translate';
import AppSpinner from '../utils/Spinner';
import { getLandingData } from '../../actions/landingData';
import './Landing.scss';
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import Calender from '../calendar/Calender';

const handleDragStart = (e) => e.preventDefault();

class Landing extends Component {
    constructor(props) { 
        super(props);
        this.state = { 
            selected:null,
            location:"/landing",
            faq:false,
            index:0
        } 
        this.selectMenu = this.selectMenu.bind(this);
        this.openFAQ = this.openFAQ.bind(this);
        this.register = this.register.bind(this);
        this.setEmail= this.setEmail.bind(this);
        this.setPhone = this.setPhone.bind(this);
        this.cancel = this.cancel.bind(this);
        this.save = this.save.bind(this);
        this.left = this.left.bind(this);
        this.right = this.right.bind(this);
        this.onGendChange = this.onGendChange.bind(this);
        this.onTimeChange = this.onTimeChange.bind(this);
        this.setLast = this.setLast.bind(this);
        this.setFirst = this.setFirst.bind(this);
        this.setAge = this.setAge.bind(this);
        this.setCity = this.setCity.bind(this);
        this.setStat = this.setStat.bind(this);
        this.setAddr = this.setAddr.bind(this);
        this.setZip = this.setZip.bind(this);
        this.setComments = this.setComments.bind(this);
        this.setProc = this.setProc.bind(this);
    } 

    componentWillReceiveProps(p) { 
        if (window.location.href.includes("join")) { 
            this.state.location = "/join";
        } 
        this.setState(this.state);
    }

    componentDidMount() {
        this.props.dispatch(getLandingData({}));
        this.state.location = this.props.match.path;
        this.setState(this.state);
    }

    selectMenu(e) { 
        window.location = e;
        this.state.location = e;
        this.setState(this.state);
    } 

    cancel() { 
        this.state.selected=null;
        this.setState(this.state);
    } 
    save() { 
        /*this.props.dispatch(register(this.state.selected)).then((e) => {
            window.location = '/thankyou';
        });*/ 
    } 
    login() { 
            window.location = '/login';
    } 
    search() { 
            window.location = '/search';
    } 
    onGendChange(e) { 
        this.state.selected.gender = e.value;
        this.setState(this.state);
    } 
    onTimeChange(e) { 
        this.state.selected.timeframe = e.value;
        this.setState(this.state);
    } 
    setCity(e) {
        this.state.selected.city=e.target.value;
        this.setState(this.state);
    } 
    setProc(e) {
        this.state.selected.procs=e.target.value;
        this.setState(this.state);
    } 
    setComments(e) {
        this.state.selected.comments=e.target.value;
        this.setState(this.state);
    } 
    openFAQ() { 
        this.state.faq = !this.state.faq;
        this.setState(this.state);
    } 
    setStat(e) {
        this.state.selected.state=e.target.value;
        this.setState(this.state);
    } 
    setAddr(e) {
        this.state.selected.addr1=e.target.value;
        this.setState(this.state);
    } 
    setAge(e) {
        this.state.selected.age=e.target.value;
        this.setState(this.state);
    } 
    setZip(e) { 
        this.state.selected.zipcode=e.target.value;
        this.setState(this.state);
    } 
    setPhone(e) { 
        let val = e.target.value.replace(/\D/g, "")
        .match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
        let validPhone = !val[2] ? val[1]: "(" + val[1] + ") " + val[2] + (val[3] ? "-" + val[3] : "");
        this.setState(prevState => ({
          selected: {
            ...prevState.selected,
            phone: validPhone
          }
        }));
        if (validPhone.length < 14 && validPhone.length > 0) {
          this.setState({ phoneMessage: 'Please add a 10 digit phone number' });
      } else {
          this.setState({ phoneMessage: '' });
      }
    }

    setEmail(e) {
        this.state.selected.email = e.target.value;
        this.setState(this.state)
        //validate email 
        const emailRegex = /^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
        this.state.isValid = emailRegex.test(this.state.selected.email);
        if (this.state.isValid) {
          this.setState(prevState => ({
            register: {
              ...prevState.register,
              email: this.state.selected.email
            },
            errorMessage: '',
          }));
        } else {
          this.setState({ errorMessage: 'Invalid email format' });
        }
    }
    setFirst(e) {
        this.state.selected.first_name = e.target.value;
        this.setState(this.state)
    }
    setLast(e) { 
        this.state.selected.last_name = e.target.value;
        this.setState(this.state)
    }

    register(e) { 
        this.state.selected = {
            type:e,
            email:'',
            age:'',
            addr1:'',
            city:'',
            timeframe:'',
            gender:'',
            state:'',
            zipcode:'',
            comments:'',
            procs:'',
            first_name:'',
            last_name:'',
            phone:''
        } 
        this.setState(this.state);
    } 
    left() { 
        if (this.state.index - 1 < 0) { return; }
        this.state.index = this.state.index - 1;
        this.setState(this.state);
    } 
    right() { 
        if (this.state.index + 1 > this.props.landingData.data.reviews.length) { return; }
        this.state.index = this.state.index + 1;
        if (this.state.index + 3 > this.props.landingData.data.reviews.length) { 
            this.state.index = this.props.landingData.data.reviews.length - 3;
        }
        this.setState(this.state);
    } 

    render() {
        var rev = [];
        var c = this.state.index;
        if (this.props.landingData && this.props.landingData.data && this.props.landingData.data.reviews) { 
            for (c; c < this.state.index + 3;c++) { 
                if (c > this.props.landingData.data.reviews.length) { continue; }
                rev.push(this.props.landingData.data.reviews[c]);
            } 
        }
        return (
        <>
        <Navbar/>
            {(this.props.landingData && this.props.landingData.data && this.props.landingData.data.pricing) && (
            <>
            <div style={{margin:20}}>
                <Grid container xs="12" md="12">
                    <Grid item xs="12" md="6">
                        <div style={{backgroundColor:"black",display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            <iframe src="https://player.vimeo.com/video/954405043?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" 
                                frameBorder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write" 
                                style={{height:800,width:"100%"}}
                                title="PoundPain_video_V1_2">
                            </iframe>
                        </div>
                    </Grid>
                    <Grid item xs="12" md="6" style={{marginTop:20,paddingRight:0,marginRight:0}}>
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            <iframe 
                                src='https://calendly.com/melissa-gopoundpain/10min?_kx=p12gT4sSUTlIplHLgkYh4w.RucnQz'
                                style={{width:window.innerWidth < 500 ? window.innerWidth : "600px",
                                        height:window.innerWidth < 500 ? "800px" : "1000px",
                                        }}
                                title="PoundPain Invite">
                            </iframe>
                        </div>
                    </Grid>
                </Grid>
            </div>
            </>
            )}
        </>
        )
    }
}

function mapStateToProps(store) {
    return {
        currentUser: store.auth.currentUser,
        landingData: store.landingData
    }
}

export default connect(mapStateToProps)(Landing);
