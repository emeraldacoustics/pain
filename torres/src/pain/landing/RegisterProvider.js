import React, { Component, createRef } from 'react';
import { connect } from 'react-redux';
import { setupIntent } from '../../actions/setupIntent';
import { withRouter } from 'react-router-dom';
import {
    Container,
    Grid,
    Button,
    Typography,
    Paper,
    Box,
    CssBaseline,
    Snackbar,
    Alert,
    Stepper,
    Step,
    StepLabel
} from '@mui/material';
import Navbar from '../../components/Navbar';
import Pricing from '../../components/Pricing';
import AppSpinner from '../utils/Spinner';
import formatPhoneNumber from '../utils/formatPhone';
import {loadStripe} from '@stripe/stripe-js';
import { getLandingData } from '../../actions/landingData';
import { registerProvider } from '../../actions/registerProvider';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../theme';
import TemplateTextFieldPhone from '../utils/TemplateTextFieldPhone';
import TemplateTextField from '../utils/TemplateTextField';
import TemplateButton from '../utils/TemplateButton';
import BillingCreditCardForm from './BillingCreditCardForm';
import {stripeKey} from '../../stripeConfig';
import {staxxKey} from '../../staxxConfig';
import {CardElement,ElementsConsumer,Elements} from '@stripe/react-stripe-js';

var StaxJs = window.StaxJs;
const stripePromise = loadStripe(stripeKey());

class RegisterProvider extends Component {
    formRef = createRef();

    stackJs = {}
    state = {
        page: -1,
        plan: 0,
        staxxLoaded: false,
        card: null,
        cardObj: null,
        currentName: '',
        currentPhone: '',
        disableRegister:true,
        first: '',
        last: '',
        staxxValues: {},
        phone: '',
        staxJsInit:false,
        email: '',
        zipcode: '',
        error_message: null,
        pq_id: null,
        coupon: null,
        setPrice: 0,
        calculatedPrice: 0,
        coupon_id: null,
        couponRed: '$0.00',
        couponRedValue: 0,
        showAddresses: [],
        intentid: '',
        selPlan: null,
        license: '',
        provtype: 1,
        provtypeSel: ['Chiropractor'],
        snackbarOpen: false,
        snackbarMessage: '',
        snackbarSeverity: 'success'
    };

    componentDidMount() {

        const { id, pq_id } = this.props.match.params;
        this.setState({ plan: id, pq_id });
        this.props.dispatch(getLandingData({ type: this.state.provtype, pq_id }));
        if (id) { 
            this.setState({ page:0, plan: id });
        } 
        const { location } = this.props;
        if (location.state && location.state.selectedPlan) {
            this.setState({ selPlan: location.state.selectedPlan });
        }
        this.props.dispatch(setupIntent()).then((e) =>  { 
            this.state.newcard = {id:0};
            this.setState(this.state);
        })
    }

    componentDidUpdate(prevProps) {
        if (this.props.landingData && this.props.landingData.data && this.props.landingData.data.pricing && !this.state.selPlan) {
            const { pq, pricing, do_billing_charge, all_plans } = this.props.landingData.data;
            if (pq && this.state.pq_id && !this.state.phone) {
                this.setState({
                    phone: formatPhoneNumber(pq.phone),
                    first: `${pq.first_name} ${pq.last_name}`,
                    name: pq.name,
                    email: pq.email,
                    showAddresses: pq.addr,
                    selPlan: this.state.selPlan || pricing.find((e) => parseInt(pq.plan) === e.id) || null,
                });
            } else if (this.state.plan && !this.state.phone && pricing) {
                this.setState({
                    selPlan: pricing.find((e) => parseInt(this.state.plan) === e.id) || null
                });
            } else if (pricing && !this.state.selPlan) {
                this.setState({
                    selPlan: pricing.find((e) => parseInt(this.state.plan) === e.id) || null
                });
            }

            if (do_billing_charge === 0 && this.state.page === 0) {
                this.setState({ 
                    selPlan: all_plans.find((e) => e.placeholder === 1) || null,
                    page: 0 
                });
            }
        }
    }

    onCardChange = (e,card,res) => { 
        if (e.complete) { 
            this.state.disableRegister = false;
            this.state.cardObj = res;
            this.setState(this.state);
        } else { 
            this.state.disableRegister = true;
            this.setState(this.state);
        } 
    } 

    onStaxTokenize() { 
    } 

    initStax() { 
        if (this.state.staxJsInit) { return; }
        var staxJs = new StaxJs( staxxKey() , {
          number: {
            id: 'card-number',     // the html id of the div you want to contain the credit card number field
            placeholder: '0000 0000 0000 0000',    // the placeholder the field should contain
            style: 'border:1px solid #d4d4d4;height: 35px; width: 100%; font-size: 15px;',    // the style to apply to the field
            type: 'text',    // the input type (optional)
            format: 'prettyFormat'    // the formatting of the CC number (prettyFormat || plainFormat || maskedFormat)
          },
          cvv: {
            id: 'card-cvv',    // the html id of the div you want to contain the cvv field
            placeholder: 'CVV',    // the placeholder the field should contain
            style: 'border:1px solid #d4d4d4;height: 35px; width: 100%; font-size: 15px;',    // the style to apply to the field
            type: 'text'    // the input type (optional)
          }
        });

        staxJs.showCardForm().then(handler => {
              if (this.state.staxxLoaded) { return; } 
              this.setState({staxxLoaded: true});
        });

        staxJs.on("card_form_complete", message => {
          if (!this.state.staxxValues.month || this.state.staxxValues.month.length !== 2) { 
              this.setState({ disableRegister: true});
          }
          else if (!this.state.staxxValues.year || this.state.staxxValues.year.length !== 4) { 
              this.setState({ disableRegister: true});
          }
          else if (!message.validNumber || !message.validCvv) { 
              this.setState({ disableRegister: true });
          } else { 
              this.setState({ disableRegister: false });
          }
        }); 

        staxJs.on("card_form_incomplete", message => {
          this.setState({ disableRegister: true});
        }); 
        this.staxJs = staxJs;
        this.state.staxJsInit = true;
        this.setState(this.state);
    } 

    handleNameChange = (event) => {
        const { name, value } = event.target;
        this.setState({ name: value }, this.checkValid);
    }

    handleFirstChange = (event) => {
        const { name, value } = event.target;
        this.setState({ first: value }, this.checkValid);
    }

    handleLastChange = (event) => {
        const { name, value } = event.target;
        this.setState({ last: value }, this.checkValid);
    }

    handleEmailChange = (event) => {
        const { name, value } = event.target;
        this.setState({ email: value }, this.checkValid);
    }

    handlePhoneChange = (event) => {
        const phone = formatPhoneNumber(event.target.value);
        this.setState({ phone });
    };

    handleCouponChange = (event) => {
        this.setState({ coupon: event.target.value }, this.getCoupon);
    };

    getCoupon = () => {
        const { coupon, selPlan } = this.state;
        const matchingCoupon = selPlan?.coupons.find((e) => coupon === e.name);
        if (matchingCoupon) {
            const discountValue = this.calculateDiscount(matchingCoupon);
            this.setState({
                coupon_id: matchingCoupon.id,
                couponRed: `($${discountValue.toFixed(2)})`,
                couponRedValue: -discountValue.toFixed(2),
            });
        } else {
            this.setState({ couponRed: '$0.00', couponRedValue: 0.00 });
        }
    };

    calculateDiscount = (coupon) => {
        const totalCost = this.state.selPlan.upfront_cost * this.state.selPlan.duration;
        if (coupon.perc) {
            return totalCost * coupon.perc;
        } else if (coupon.total) {
            return totalCost - coupon.total;
        } else if (coupon.reduction) {
            return coupon.reduction;
        }
        return 0;
    };

    calculatePrice = () => {
        const { selPlan, couponRedValue } = this.state;
        if (selPlan) {
            const totalCost = selPlan.upfront_cost * selPlan.duration;
            const finalPrice = totalCost + parseFloat(couponRedValue);
            return `$${finalPrice.toFixed(2)}`;
        }
        return '$0.00';
    };

    nextPage = () => {
        this.setState((prevState) => ({ page: prevState.page + 1 }));
    };

    prevPage = () => {
        this.setState((prevState) => ({ page: prevState.page - 1 }));
    };

    registerProvider = () => {
        let tosend = {
          name: this.state.first + " " + this.state.last,
          address_phone: this.state.phone
        };
        const { email, first, name, phone, selPlan, last, zipcode, showAddresses, coupon_id, pq_id, provtype } = this.state;
        const verifiedAddresses = showAddresses.filter((e) => e.verified);
        const registrationData = {
            email,
            first,
            name,
            phone,
            card: this.state.cardObj,
            billing_system_id: this.props.landingData.data.billing_system_id,
            cust_id: this.props.setupIntent.data.data.cust_id,
            intent_id: this.props.setupIntent.data.data.id,
            plan: selPlan.id,
            provtype,
            last,
            zipcode,
            addresses: verifiedAddresses,
            coupon_id,
            pq_id,
        };

        if (this.props.landingData.data.billing_system_id===3) { 
            const details = { 
                method:"card",
                first_name:this.state.first,
                last_name:this.state.last,
                email: this.state.email,
                month:this.state.staxxValues.month,
                year:this.state.staxxValues.year,
                address_state:"FL",
                validate:false,
                match_customer:false
            } 
            this.staxJs
                .tokenize(details)
                .then((response) => {
                  registrationData.card = response;
                  this.props.dispatch(registerProvider(registrationData, (err, args) => {
                            if (err) {
                                this.setState({
                                    snackbarOpen: true,
                                    snackbarMessage: err.message,
                                    snackbarSeverity: 'error'
                                });
                                return;
                            }
                            window.location = '/welcome';
                  })); 
                })
                .catch((err) => {
                  this.state.message = err.message;
                  this.setState(this.state);
                });
        } else { 
            this.props.dispatch(registerProvider(registrationData, (err, args) => {
                if (err) {
                    this.setState({
                        snackbarOpen: true,
                        snackbarMessage: err.message,
                        snackbarSeverity: 'error'
                    });
                    return;
                }
                window.location = '/welcome';
            }));
        }
    };

    handleFieldChange = event => {
        const { staxxValues } = this.state;
        const { name, value } = event.target;
        this.setState({ staxxValues : { ...staxxValues, [name]: value } });
        if (name === 'month' && value.length !== 2) { 
            this.setState({ disableRegister: true});
        } else { 
            this.setState({ disableRegister: false});
        } 
        if (name === 'year' && value.length !== 4) { 
            this.setState({ disableRegister: true});
        } else { 
            this.setState({ disableRegister: false});
        } 
    };

    checkValid = () => {
        this.setState({ isValid: true });
    };

    handleCloseSnackbar = () => {
        this.setState({ snackbarOpen: false });
    };

    handleSelectPlan = (planId) => {
        const { landingData } = this.props;
        const selectedPlan = landingData.data.pricing.find(plan => plan.id === planId);
        this.setState({ selPlan: selectedPlan, page: 0 }, () => {
            if (this.formRef.current) {
                this.formRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        });
    };

    renderStepContent = (step) => {
        const { selPlan, phone, couponRed, error_message, snackbarOpen, snackbarMessage, snackbarSeverity } = this.state;
        const { registerProvider, landingData } = this.props;
        switch (step) {
            case -1:
                return(<></>)
            case 0:
                return (
                    <Box component="form" noValidate sx={{ mt: 1 }}>
                        <Typography variant="h6" align="center" gutterBottom>
                            Please enter the information below to register
                        </Typography>
                        {error_message && (
                            <Typography color="error" gutterBottom>
                                {error_message}
                            </Typography>
                        )}
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TemplateTextField
                                    fullWidth
                                    required
                                    label="Practice Name"
                                    name="name"
                                    onChange={this.handleNameChange}
                                    margin="normal"
                                    sx={{ backgroundColor: '#eee', borderRadius: '8px' }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TemplateTextField
                                    fullWidth
                                    required
                                    label="First Name"
                                    name="first"
                                    onChange={this.handleFirstChange}
                                    margin="normal"
                                    sx={{ backgroundColor: '#eee', borderRadius: '8px' }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TemplateTextField
                                    fullWidth
                                    required
                                    label="Last Name"
                                    name="last"
                                    onChange={this.handleLastChange}
                                    margin="normal"
                                    sx={{ backgroundColor: '#eee', borderRadius: '8px' }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TemplateTextField
                                    fullWidth
                                    required
                                    label="Email"
                                    name="email"
                                    onChange={this.handleEmailChange}
                                    margin="normal"
                                    sx={{ backgroundColor: '#eee', borderRadius: '8px' }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TemplateTextFieldPhone
                                    fullWidth
                                    required
                                    label="Phone"
                                    name="phone"
                                    value={phone}
                                    onChange={this.handlePhoneChange}
                                    margin="normal"
                                    sx={{ backgroundColor: '#eee', borderRadius: '8px' }}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </Grid>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                            <TemplateButton
                                variant="contained"
                                color="primary"
                                onClick={landingData.data.do_billing_charge !== 0 ? this.nextPage : this.registerProvider}
                                sx={{ borderRadius: 8, backgroundColor: '#FF5733', color: '#fff', padding: '10px 45px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}
                                label={landingData.data.do_billing_charge !== 0 ? 'Next' : 'Register'}/>
                        </Box>
                    </Box>
                );
            case 1:
                return (
                    <Box sx={{ mt: 3 }}>
                        {this.initStax()}
                        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Checkout
                            </Typography>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={7}>
                                    <Typography variant="body1">Description</Typography>
                                </Grid>
                                <Grid item xs={5} textAlign="right">
                                    <Typography variant="body1">Price</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2">{selPlan.description}</Typography>
                                </Grid>
                                <Grid item xs={12} textAlign="right">
                                    <Typography variant="body2">${parseFloat(selPlan.upfront_cost * selPlan.duration).toFixed(2)}</Typography>
                                </Grid>
                                {selPlan.coupons && selPlan.coupons.length > 0 && (
                                    <>
                                        <Grid item xs={7}>
                                            <TemplateTextField
                                                fullWidth
                                                placeholder="Enter Coupon Code"
                                                value={this.state.coupon}
                                                onChange={this.handleCouponChange}
                                                sx={{ backgroundColor: '#eee', borderRadius: '8px' }}
                                            />
                                        </Grid>
                                        <Grid item xs={5} textAlign="right">
                                            <Typography variant="body2">{couponRed}</Typography>
                                        </Grid>
                                    </>
                                )}
                            </Grid>
                            <Grid container spacing={2} sx={{ mt: 2 }}>
                                <Grid item xs={7}>
                                    <Typography variant="body1">Total</Typography>
                                </Grid>
                                <Grid item xs={5} textAlign="right">
                                    <Typography variant="body1">{this.calculatePrice()}</Typography>
                                </Grid>
                            </Grid>
                            {(this.props.landingData && this.props.landingData.data && this.props.landingData.data.billing_system_id===3) && (
                            <Grid container spacing={2} sx={{ mt: 2 }}>
                                <Grid item xs={12}>
                                    <div id="card-element" classname="field">
                                        <div style={{height:100,display:"flex",justifyContent:"space-evenly"}}>
                                            <div id="card-number" classname="card-number"></div>
                                            <div id="card-cvv" classname="card-cvv"></div>
                                            <div style={{color:'black'}} className="expiry-month">
                                                <input
                                                  className="field"
                                                  name="month"
                                                  style={{color:'black'}}
                                                  maxLength="2"
                                                  placeholder="MM"
                                                  onChange={this.handleFieldChange}
                                                  value={this.state.staxxValues.month || ""}
                                                />
                                            </div>
                                            <div>/</div>
                                            <div style={{color:'black'}} className="expiry-year">
                                                <input
                                                  className="field"
                                                  name="year"
                                                  style={{color:'black'}}
                                                  maxLength="4"
                                                  placeholder="YYYY"
                                                  onChange={this.handleFieldChange}
                                                  value={this.state.staxxValues.year || ""}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Grid>
                            </Grid>
                            )}
                            {(this.props.landingData && this.props.landingData.data && this.props.landingData.data.billing_system_id===1) && (
                            <Grid container spacing={2} sx={{ mt: 2 }}>
                                <Grid item xs={12}>
                                {(this.props.setupIntent && this.props.setupIntent.data &&
                                  this.props.setupIntent.data.data &&
                                  this.props.setupIntent.data.data.id) && (
                                    <Elements stripe={stripePromise} options={{clientSecret:this.props.setupIntent.data.data.clientSecret}}>
                                        <ElementsConsumer>
                                            {(ctx) => <BillingCreditCardForm onSave={this.saveCard} onCardChange={this.onCardChange} data={this.state} stripe={stripePromise}
                                                onCancel={this.cancel} intentid={this.props.setupIntent.data.data.id} {...ctx} />}
                                        </ElementsConsumer>
                                    </Elements>
                                )}
                                </Grid>
                            </Grid>
                            )}
                        </Paper>
                        <Box sx={{ display:'flex',justifyContent:'center', mt: 3 }}>
                            <Button
                                variant="contained"
                                disabled={this.state.disableRegister}
                                color="primary"
                                sx={{ borderRadius: 8, backgroundColor: '#FF5733', color: '#fff', padding: '10px 45px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', mb: 2 }}
                                onClick={this.registerProvider}
                            >
                                Register
                            </Button>
                        </Box>
                    </Box>
                );
            default:
                return 'Unknown step';
        }
    };

    render() {
        const { page, selPlan, snackbarOpen, snackbarMessage, snackbarSeverity } = this.state;
        const { registerProvider, landingData } = this.props;

    
        var steps = ['Register Information', 'Payment Details'];
        if (this.props.landingData.data && this.props.landingData.data.do_billing_charge === 0) { 
            steps = ['Register Information'];
        } 

        if (!this.props.landingData.data.pricing) { return (<></>); }

        return (
            <ThemeProvider theme={theme}>
                <Navbar />
                {(false && !selPlan) && (
                    <Pricing office_type={1} onSelectPlan={this.handleSelectPlan} showButton={true} />
                )}
                <CssBaseline />
                {registerProvider.isReceiving && <AppSpinner />}
                {landingData.data && this.state.page >= 0 && (
                    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
                        <Container maxWidth="md">
                            <Paper
                                elevation={12}
                                sx={{
                                    width: '100%',
                                    padding: { xs: 2, sm: 4, md: 6 },
                                    borderRadius: '30px',
                                    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.35)',
                                    backgroundColor: '#fff',
                                }}
                                ref={this.formRef}
                            >
                                <Stepper activeStep={page} alternativeLabel>
                                    {steps.map((label) => (
                                        <Step key={label}>
                                            <StepLabel>{label}</StepLabel>
                                        </Step>
                                    ))}
                                </Stepper>
                                {this.renderStepContent(page)}
                                <Box sx={{ display: 'flex', justifyContent:'center', flexDirection: 'row', pt: 2 }}>
                                    <Button
                                        color="inherit"
                                        disabled={page === 0}
                                        onClick={this.prevPage}
                                        sx={{ mr: 1 }}
                                    >
                                        Back
                                    </Button>
                                </Box>
                            </Paper>
                        </Container>
                    </Box>
                )}
                <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={this.handleCloseSnackbar}>
                    <Alert onClose={this.handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
            </ThemeProvider>
        );
    }
}

const mapStateToProps = (state) => ({
    landingData: state.landingData,
    registerProvider: state.registerProvider,
    setupIntent: state.setupIntent
});

export default withRouter(connect(mapStateToProps)(RegisterProvider));
