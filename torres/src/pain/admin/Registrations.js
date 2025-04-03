import React, { Component } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { toast } from 'react-toastify';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Select from 'react-select';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import InputIcon from '@mui/icons-material/Input';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import AddBoxIcon from '@mui/icons-material/AddBox';
import AssessmentIcon from '@mui/icons-material/Assessment';
import moment from 'moment';
import EditIcon from '@mui/icons-material/Edit';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import salesforceURL from '../../salesforceConfig';
import squareLocationKey from '../../squareConfig';
import { connect } from 'react-redux';
import cx from 'classnames';
import classnames from 'classnames';
import translate from '../utils/translate';
import AppSpinner from '../utils/Spinner';
import { getRegistrations } from '../../actions/registrationsAdminList';
import { getRegistrationReport } from '../../actions/registrationReport';
import { getPlansList } from '../../actions/plansList';
import { registrationAdminUpdate } from '../../actions/registrationAdminUpdate';
import formatPhoneNumber from '../utils/formatPhone';
import PainTable from '../utils/PainTable';
import TemplateSelect from '../utils/TemplateSelect';
import TemplateSelectEmpty from '../utils/TemplateSelectEmpty';
import TemplateSelectMulti from '../utils/TemplateSelectMulti';
import TemplateTextField from '../utils/TemplateTextField';
import TemplateCheckbox from '../utils/TemplateCheckbox';
import TemplateButton from '../utils/TemplateButton';
import TemplateButtonIcon from '../utils/TemplateButtonIcon';
import TemplateBadge from '../utils/TemplateBadge';
import Navbar from '../../components/Navbar';
import RegistrationsEdit from './RegistrationsEdit';
import Office365SSO from '../utils/Office365SSO';
import Tickets from './Tickets';
import { Container } from '@mui/material';
import DealTracker from './DealTracker';

class Registrations extends Component {
    constructor(props) { 
        super(props);
        this.state = { 
            selected: null,
            activeTab: "myregistrations",
            typeSelected:null,
            transition:false,
            statusSelected:null,
            Selected:null,
            search:null,
            altFilter: [],
            filterName: null,
            statusAltSelected:null,
            filter: [],
            saveSearches:[],
            filterType: [],
            subTab: "plans",
            mine: true,
            massSel:[],
            userSelected:null,
            userFilter:[],
            massUpdateValue:{},
            sort:null,
            drawerOpen:false,
            direction:0,
            pq_id:null,
            page: 0,
            pageSize: 10
        }
        this.search = this.search.bind(this);
        this.searchUpdate = this.searchUpdate.bind(this);
        this.showAllRecords = this.showAllRecords.bind(this);
        this.updateFilter = this.updateFilter.bind(this);
        this.onMassUpdateValue = this.onMassUpdateValue.bind(this);
        this.toggleDrawer = this.toggleDrawer.bind(this);
        this.transition = this.transition.bind(this);
        this.cancelMass = this.cancelMass.bind(this);
        this.saveMass = this.saveMass.bind(this);
        this.close = this.close.bind(this);
        this.onMassChange = this.onMassChange.bind(this);
        this.onTypeFilter = this.onTypeFilter.bind(this);
        this.onUserFilter = this.onUserFilter.bind(this);
        this.save = this.save.bind(this);
        this.reload = this.reload.bind(this);
        this.providerReport = this.providerReport.bind(this);
        this.dncReport = this.dncReport.bind(this);
        this.edit = this.edit.bind(this);
        this.add = this.add.bind(this);
        this.onStatusFilter = this.onStatusFilter.bind(this);
        this.pageChange = this.pageChange.bind(this);
        this.sortChange = this.sortChange.bind(this);
        this.loadSavedSearch = this.loadSavedSearch.bind(this);
        this.saveSearchValue = this.saveSearchValue.bind(this);
        this.saveSearchName = this.saveSearchName.bind(this);
        this.pageGridsChange = this.pageGridsChange.bind(this);
    } 

    componentWillReceiveProps(p) { 
        var changed = false;
        if (p.registrationsAdminList.data && p.registrationsAdminList.data.config && 
            p.registrationsAdminList.data.config.commission_users && this.state.userSelected === null) { 
            var c = 0;
            var t = [];
            var t1 = [];
            for (c = 0; c < p.registrationsAdminList.data.config.commission_users.length; c++) { 
                t.push(p.registrationsAdminList.data.config.commission_users[c]); 
                t1.push(p.registrationsAdminList.data.config.commission_users[c].id); 
            } 
            this.state.userSelected = t;
            this.state.userFilter = t1;
            this.setState(this.state);
            changed = true;
        } 
        if (p.registrationsAdminList.data && p.registrationsAdminList.data.config && 
            p.registrationsAdminList.data.config.status && this.state.statusSelected === null) { 
            var c = 0;
            var t = [];
            var t1 = [];
            for (c = 0; c < p.registrationsAdminList.data.config.status.length; c++) { 
                if (p.registrationsAdminList.data.config.status[c].name === 'IN_NETWORK') { continue; }
                if (p.registrationsAdminList.data.config.status[c].name === 'CLOSED_WON') { continue; }
                if (p.registrationsAdminList.data.config.status[c].name === 'APPROVED') { continue; }
                if (p.registrationsAdminList.data.config.status[c].name === 'DO_NOT_CONTACT') { continue; }
                if (p.registrationsAdminList.data.config.status[c].name === 'INACTIVE') { continue; }
                if (p.registrationsAdminList.data.config.status[c].name === 'DUPLICATE') { continue; }
                if (p.registrationsAdminList.data.config.status[c].name === 'DENIED') { continue; }
                t.push(p.registrationsAdminList.data.config.status[c]); 
                t1.push(p.registrationsAdminList.data.config.status[c].id); 
            } 
            this.state.statusSelected = t;
            this.state.filter = t1;
            var v = [];
            var v1 = [];
            c = 0;
            for (c = 0; c < p.registrationsAdminList.data.config.type.length; c++) { 
                v.push(p.registrationsAdminList.data.config.type[c]); 
                v1.push(p.registrationsAdminList.data.config.type[c].id); 
            } 
            this.state.typeSelected = v;
            this.state.filterType = v1;
            this.setState(this.state);
            if (changed) { this.reload(); }
        } 
    }
    close() { 
        this.state.selected = null;
        this.setState(this.state);
    } 

    cancelMass() { 
        this.state.transition = false;
        this.state.massSel = [];
        this.state.massUpdateValue = {};
        this.setState(this.state);
    } 

    saveMass() { 
        var tosend = {bulk:this.state.massSel}
        this.props.dispatch(registrationAdminUpdate(tosend,function(err,args) { 
                args.reload();
                toast.success('Successfully saved registration.', {
                    position:"top-right",
                    autoClose:3000,
                    hideProgressBar:true
                }
                );
                args.cancelMass()
            },this));
    } 

    showAllRecords() { 
        this.state.mine = !this.state.mine;
        this.setState(this.state);
        this.reload()
    } 

    loadSavedSearch(e) { 
        var g = this.state.saveSearches.findIndex((f) => f.name === e.name)
        if (g !== -1) { 
            var vals = this.state.saveSearches[g];
            this.state.filterName = e;
            this.state.typeSelected = vals.type[0];
            this.state.filterType = vals.type[1];
            this.state.statusAltSelected = vals.alt_status[0];
            this.state.altFilter = vals.alt_status[1];
            this.state.statusSelected = vals.status[0];
            this.state.filter = vals.status[1]
            this.setState(this.state);
            this.reload();
            this.toggleDrawer();
        } else { 
            toast.error('Didnt find that saved search.', {
                position:"top-right",
                autoClose:3000,
                hideProgressBar:true
            });
        }
    } 

    saveSearchValue(e) { 
        var q = this.state.saveSearches.findIndex((f) => f.name === e.target.value)
        if (q !== -1) { 
            this.state.saveSearches[q] = {
                name:this.state.searchname,
                type:[this.state.typeSelected,this.state.filterType],
                alt_status:[this.state.statusAltSelected,this.state.altFilter],
                status:[this.state.statusSelected,this.state.filter]
            }
        } else { 
            this.state.saveSearches.push({
                name:this.state.searchname,
                type:[this.state.typeSelected,this.state.filterType],
                alt_status:[this.state.statusAltSelected,this.state.altFilter],
                status:[this.state.statusSelected,this.state.filter]
            })
        } 
        this.state.searchname = '';
        this.setState(this.state);
    } 
    saveSearchName(e) { 
        this.state.searchname = e.target.value;;
        this.setState(this.state);
    }  

    onMassUpdateValue(e,t) { 
        this.state.massUpdateValue[e] = t.target.value;
        var c = 0;
        if (e === 'commission_user_id') { 
            var v = this.props.registrationsAdminList.data.config.commission_users.filter((f) => f.name === t.target.value)
            for (c = 0; c < this.state.massSel.length; c++) { 
                this.state.massSel[c][e] = v[0].id
                this.state.massSel[c]['commission_name'] = v[0].name
            } 
        } 
        this.setState(this.state);
    } 

    sortChange(t) { 
        var g = this.props.registrationsAdminList.data.sort.filter((e) => t.dataField === e.col);
        if (g.length > 0) { 
            g = g[0]
            this.state.sort = g.id
            this.state.direction = g.direction === 'asc' ? 'desc' : 'asc'
            this.setState(this.state);
            this.reload()
        } 
    } 

    transition() { 
        this.state.transition = true;
        this.setState(this.state);
    } 

    pageGridsChange(t) { 
        this.state.pageSize = t
        this.state.page = 0
        this.setState(this.state);
        this.reload()
    } 
    pageChange(e) { 
        this.state.page = e
        this.setState(this.state);
        this.reload();
    } 

    onMassChange(e) { 
        this.state.massSel = e;
        this.setState(this.state);
    } 

    searchUpdate(e) { 
        this.state.search = e.target.value;
        if (this.state.search.length === 0) { 
            this.state.search = null;
            this.setState(this.state);
            this.reload();
        } 
        this.setState(this.state);
    } 

    search(e) { 
        this.reload();
    } 


    onTypeFilter(e,t) { 
        var c = 0;
        var t = [];
        var t1 = [];
        for (c = 0; c < e.length; c++) { 
            t1.push(e[c].id); 
            t.push(e[c]); 
        } 
        this.state.typeSelected = t;
        this.state.filterType = t1;
        // this.reload();
        this.setState(this.state)
    } 

    onUserFilter(e,t) { 
        var c = 0;
        var t = [];
        var t1 = [];
        for (c = 0; c < e.length; c++) { 
            e[c].name = e[c].value;
            t.push(e[c]); 
            t1.push(e[c].id);
        } 
        this.state.userSelected = t;
        this.state.userFilter = t1;
        this.setState(this.state)
        // this.reload();
    } 

    onStatusFilter(e,t) { 
        var c = 0;
        var t = [];
        var t1 = [];
        for (c = 0; c < e.length; c++) { 
            e[c].name = e[c].value;
            t.push(e[c]); 
            t1.push(e[c].id);
        } 
        this.state.statusSelected = t;
        this.state.filter = t1;
        this.setState(this.state)
        // this.reload();
    } 

    componentDidMount() {
        this.props.dispatch(getPlansList({}));
        this.reload()
    }

    add() { 
        this.state.selected = {
            email:'',
            first_name:'',
            initial_payment:0,
            last_name:'',
            phone: '',
            name: '',
            addr:[],
            comments:[],
            provider_queue_status_id: 1,
            invoice_id:0,
            pricing_id:0,
            invoice_items:[]
        }
        this.state.selected.plans = {}
        this.state.selected.plans.items = [{
            id:0,description:'',price:0,quantity:1,total:0
        }]
        this.setState(this.state);
    } 
    reload() { 
        this.props.dispatch(getRegistrations(
            {mine:this.state.mine,type:this.state.filterType,sort:this.state.sort,direction:this.state.direction,
             search:this.state.search,limit:this.state.pageSize,users:this.state.userFilter,
            offset:this.state.page,status:this.state.filter,alt_status:this.state.altFilter}
        ,function(err,args) { args.close() },this));
    }

    updateFilter() { 
        this.reload();
        this.toggleDrawer();
        this.setState(this.state);
    } 

    toggleDrawer(e) {
        this.state.drawerOpen = !this.state.drawerOpen;
        this.setState(this.state);
    };

    save(tosend) { 
        this.props.dispatch(registrationAdminUpdate(tosend,function(err,args) { 
                toast.success('Successfully saved registration.', {
                    position:"top-right",
                    autoClose:3000,
                    hideProgressBar:true
                });
                args.reload()
            },this));
    } 

    dncReport() { 
        this.props.dispatch(getRegistrations(
            {type:this.state.filterType,sort:this.state.sort,direction:this.state.direction,
             search:this.state.search,limit:this.state.pageSize, report:1, dnc:1,
            offset:this.state.page,status:this.state.filter,alt_status:this.state.altFilter}
        ));
    } 

    providerReport() { 
        this.props.dispatch(getRegistrations(
            {type:this.state.filterType,sort:this.state.sort,direction:this.state.direction,
             search:this.state.search,limit:this.state.pageSize, report:1,
            offset:this.state.page,status:this.state.filter,alt_status:this.state.altFilter}
        ));
    } 

    edit(r) { 
        this.state.selected = JSON.parse(JSON.stringify(r));
        this.setState(this.state);
    } 

    render() {
        var regheads = [
            {
                dataField:'office_id',
                sort:true,
                hidden:true,
                onClick: (content,row) => (
                    this.edit(content)
                ),
                text:'ID'
            },
            {
                dataField:'name',
                sort:true,
                onClick: (content,row) => (
                    this.edit(content)
                ),
                text:'Practice Name'
            },
            {
                dataField:'provider_name',
                sort:true,
                onClick: (content,row) => (
                    this.edit(content)
                ),
                text:'Provider Name',
                formatter:(cellContent,row) => (
                    <div>
                        {row.last_name + ", " + row.first_name}
                    </div>
                )
            },
            {
                dataField:'state',
                sort:true,
                align:'center',
                onClick: (content,row) => (
                    this.edit(content)
                ),
                text:'State'
            },
            {
                dataField:'office_type',
                sort:true,
                align:'center',
                text:'Office Type',
                onClick: (content,row) => (
                    this.edit(content)
                ),
                formatter:(cellContent,row) => (
                    <div>
                        {row.office_type}
                    </div>
                )
            },
            {
                dataField:'city',
                sort:true,
                text:'City',
                onClick: (content,row) => (
                    this.edit(content)
                ),
                formatter:(cellContent,row) => (
                    <div>
                        {row.city + ", " + row.state + " " + row.zipcode} 
                    </div>
                )
            },
            {
                dataField:'commission_name',
                sort:true,
                text:'Assignee',
                onClick: (content,row) => (
                    this.edit(content)
                ),
                formatter:(cellContent,row) => (
                    <div>
                        {row.commission_name && <TemplateBadge label={row.commission_name}/>}
                    </div>
                )
            },
            {
                dataField:'status',
                sort:true,
                align:'center',
                text:'Status',
                onClick: (content,row) => (
                    this.edit(content)
                ),
                formatter:(cellContent,row) => (
                    <div>
                        {row.status && (<TemplateBadge label={row.status}/>)}
                    </div>
                )
            },
        ]
        var regheads_noact = [
            {
                dataField:'office_id',
                sort:true,
                text:'ID'
            },
            {
                dataField:'name',
                sort:true,
                text:'Name'
            },
            {
                dataField:'email',
                sort:true,
                text:'Email'
            },
            {
                dataField:'office_type',
                sort:true,
                align:'center',
                text:'Office Type',
                formatter:(cellContent,row) => (
                    <div>
                        {row.office_type}
                    </div>
                )
            },
            {
                dataField:'city',
                sort:true,
                text:'Location',
                formatter:(cellContent,row) => (
                    <div>
                        {row.city + ", " + row.state + " " + row.zipcode}
                    </div>
                )
            },
            {
                dataField:'commission_name',
                sort:true,
                text:'Assignee',
                formatter:(cellContent,row) => (
                    <div>
                        {row.commission_name && <TemplateBadge label={row.commission_name}/>}
                    </div>
                )
            },
            {
                dataField:'status',
                sort:true,
                align:'center',
                text:'Status',
                formatter:(cellContent,row) => (
                    <div>
                        {row.status && (<TemplateBadge label={row.status}/>)}
                    </div>
                )
            },
        ]
        if (this.props.registrationsAdminList && this.props.registrationsAdminList.data && 
            this.props.registrationsAdminList.data.sort) { 
            var c = 0; 
            for (c=0;c < regheads.length; c++) { 
                var q = regheads[c]
                var t = this.props.registrationsAdminList.data.sort.filter((g) => q.dataField === g.col);
                if (t.length > 0) { 
                    t = t[0]
                    regheads[c].sort=true;
                    if (t.active) { 
                        regheads[c].order = t['direction']
                    } else { 
                        regheads[c].order = 'asc'
                    } 
                } else { 
                    regheads[c].sort=false;
                } 
            } 
        }  
        return (
        <>
            {(this.props.plansList && this.props.plansList.isReceiving) && (
                <AppSpinner/>
            )}
            {(this.props.registrationAdminUpdate && this.props.registrationAdminUpdate.isReceiving) && (
                <AppSpinner/>
            )}
            {(this.props.registrationReport && this.props.registrationReport.isReceiving) && (
                <AppSpinner/>
            )}
            {(this.props.registrationsAdminList && this.props.registrationsAdminList.isReceiving) && (
                <AppSpinner/>
            )}
            <Box style={{margin:0}}>
                <Office365SSO showWelcome={true}/>
                <Drawer
                  anchor="right"
                  open={this.state.drawerOpen}
                  onClose={this.toggleDrawer}
                >
                <Box sx={{ width: 400 }} role="presentation">
                    <Grid container xs="12">
                        <Grid container xs="12" style={{marginTop:10}}>
                            <h4 style={{margin:20}}>Filters:</h4>
                        </Grid>
                        <Grid container xs="12" style={{marginTop:10}}>
                            <Grid item xs="12">
                                {(this.props.registrationsAdminList && this.props.registrationsAdminList.data && 
                                this.props.registrationsAdminList.data.config &&
                                this.props.registrationsAdminList.data.config.status && this.state.statusSelected !== null) && (
                                  <TemplateSelectMulti
                                      onChange={this.onStatusFilter}
                                      label="Status"
                                      value={this.state.statusSelected.map((g) => { 
                                        return (
                                            {
                                                                            label:
                                            this.props.registrationsAdminList.data.config.status.filter((f) => f.id === g.id).length > 0 ? 
                                            this.props.registrationsAdminList.data.config.status.filter((f) => f.id === g.id)[0].name : '', value:
                                            this.props.registrationsAdminList.data.config.status.filter((f) => f.id === g.id).length > 0 ? 
                                            this.props.registrationsAdminList.data.config.status.filter((f) => f.id === g.id)[0].name : '',id:
                                            this.props.registrationsAdminList.data.config.status.filter((f) => f.id === g.id).length > 0 ? 
                                            this.props.registrationsAdminList.data.config.status.filter((f) => f.id === g.id)[0].name : '',
                                            }
                                        )
                                      })}
                                      options={this.props.registrationsAdminList.data.config.status.map((e) => { 
                                        return (
                                            { 
                                            label: e.name ? e.name : e.label,
                                            value: e.id,
                                            id: e.id,
                                            }
                                        )
                                      })}
                                    />
                                )}
                            </Grid>
                        </Grid>
                        <Grid container xs="12">
                            <Grid item xs="12">
                                {(this.props.registrationsAdminList && this.props.registrationsAdminList.data && 
                                this.props.registrationsAdminList.data.config &&
                                this.props.registrationsAdminList.data.config.type && this.state.statusSelected !== null) && (
                                  <TemplateSelectMulti
                                      onChange={this.onTypeFilter}
                                      label="Type"
                                      value={this.state.typeSelected.map((g) => { 
                                        return (
                                            {
                                            label:this.props.registrationsAdminList.data.config.type.filter((f) => f.id === g.id)[0].name,
                                            value:this.props.registrationsAdminList.data.config.type.filter((f) => f.id === g.id)[0].id,
                                            id:this.props.registrationsAdminList.data.config.type.filter((f) => f.id === g.id)[0].id
                                            }
                                        )
                                      })}
                                      options={this.props.registrationsAdminList.data.config.type.map((e) => { 
                                        return (
                                            { 
                                            label: e.name,
                                            id: e.id,
                                            value: e.id
                                            }
                                        )
                                      })}
                                    />
                                )}
                            </Grid>
                        </Grid>
                        <Grid container xs="12">
                            <Grid item xs="12">
                              {(this.props.registrationsAdminList && this.props.registrationsAdminList.data && 
                                this.props.registrationsAdminList.data.config &&
                                this.props.registrationsAdminList.data.config.commission_users && this.state.userSelected !== null) && (
                                  <TemplateSelectMulti
                                      label='User'
                                      onChange={this.onUserFilter}
                                      value={this.state.userSelected.map((g) => { 
                                        return (
                                            {
                                            label:this.props.registrationsAdminList.data.config.commission_users.filter((f) => f.id === g.id).length > 0 ? 
                                                this.props.registrationsAdminList.data.config.commission_users.filter((f) => f.id === g.id)[0].name : '',
                                            id:this.props.registrationsAdminList.data.config.commission_users.filter((f) => f.id === g.id).length > 0 ? 
                                                this.props.registrationsAdminList.data.config.commission_users.filter((f) => f.id === g.id)[0].id: ''
                                            }
                                        )
                                      })}
                                      options={this.props.registrationsAdminList.data.config.commission_users.map((e) => { 
                                        return (
                                            { 
                                            label: e.name,
                                            id: e.id
                                            }
                                        )
                                      })}
                                    />
                                )}
                            </Grid>                
                        </Grid>
                        <Grid container xs="12">
                            <Grid item xs={9}>
                                <TemplateTextField onChange={this.saveSearchName} label="Saved Name" value={this.state.searchname}/>
                            </Grid>
                            <Grid item xs={2}>
                                <TemplateButtonIcon style={{margin:10}} onClick={this.saveSearchValue} label=<SaveIcon/>/>
                            </Grid>
                        </Grid>
                        <Grid container xs="12">
                            <Grid item xs="12">
                                <h6 style={{marginLeft:10}}>Saved Filters:</h6>
                            </Grid>
                        </Grid>
                        <Grid container xs="12">
                            {this.state.saveSearches.map((e) => { 
                                return (
                                    <Grid item xs={3} style={{margin:10}} key={e.name}>
                                        <TemplateButtonIcon onClick={() => this.loadSavedSearch(e)} label={e.name}/>
                                    </Grid>
                                )
                            })}
                        </Grid>
                        <Grid container xs="12" style={{marginTop:20,borderTop:"1px solid black"}}>
                            <Grid item xs={12} style={{margin:10}}>
                                <div style={{display:"flex",justifyContent:"space-around"}}>
                                    <TemplateButton onClick={this.updateFilter} label='Update'/>
                                    <TemplateButton onClick={this.toggleDrawer} label='Close'/>
                                </div>
                            </Grid>
                        </Grid>
                    </Grid>
                </Box>
            </Drawer>
            <Grid container xs="12" style={{margin:10}}>
            <>
                {this.state.transition && (
                <> 
                    <Grid container xs="12">
                        <Grid item xs="12">
                            <h4>Transition Items</h4>
                        </Grid>
                    </Grid>
                    <Grid container xs="12" style={{marginTop:20}}>
                        <Grid item xs="1">
                            <h6>Assignee</h6>
                        </Grid>
                        <Grid item xs="3">
                          <TemplateSelect
                              label='Assignee'
                              onChange={(e) => this.onMassUpdateValue('commission_user_id',e)}
                              value={{
                                label:this.props.registrationsAdminList.data.config.commission_users.filter(
                                    (f) => f.name === this.state.massUpdateValue['commission_user_id']).length > 0 ? 
                                    this.props.registrationsAdminList.data.config.commission_users.filter(
                                    (f) => f.name === this.state.massUpdateValue['commission_user_id'])[0].name : '', 
                                value:this.props.registrationsAdminList.data.config.commission_users.filter(
                                    (f) => f.name === this.state.massUpdateValue['commission_user_id']).length > 0 ? 
                                    this.props.registrationsAdminList.data.config.commission_users.filter(
                                    (f) => f.name === this.state.massUpdateValue['commission_user_id'])[0].name : '', 
                              }}
                              options={this.props.registrationsAdminList.data.config.commission_users.map((e) => { 
                                return (
                                    { 
                                    label: e.name,
                                    value: e.name,
                                    id: e.id
                                    }
                                )
                              })}
                            />
                        </Grid>
                    </Grid>
                    <Grid container xs="12" style={{marginTop:20}}>
                        <Grid item xs="12">
                            <TemplateButtonIcon onClick={this.saveMass} label={<SaveIcon/>}/>
                            <TemplateButtonIcon outline style={{marginLeft:10}} 
                                onClick={this.cancelMass} label={<CancelIcon/>}/>
                        </Grid>
                    </Grid>
                    <Grid container xs="12" style={{marginTop:20}}>
                        <Grid item xs="12">
                            <PainTable
                                keyField='id' 
                                selectAll={false}
                                data={this.state.massSel} 
                                total={this.state.massSel.length}
                                page={0}
                                pageSize={this.state.massSel.length}
                                columns={regheads_noact}>
                            </PainTable> 
                        </Grid>
                    </Grid>
                </>
                )}
                {this.props.dealTrackerOnly && (
                <>
                    {(this.state.selected) && ( 
                        <RegistrationsEdit selected={this.state.selected} onSave={this.save} onCancel={this.close}/>
                    )}
                    {(!this.state.selected && this.props.registrationsAdminList && this.props.registrationsAdminList.data &&
                      this.props.registrationsAdminList.data.dashboard && this.props.registrationsAdminList.data.dashboard.dealtracker) && ( 
                        <div style={{overflow:"auto"}}>
                            <DealTracker 
                                dashboard={this.props.registrationsAdminList.data.dashboard.dealtracker}
                                onEdit={this.edit}
                                data={this.props.registrationsAdminList.data.deal_tracker}
                                config={this.props.registrationsAdminList.data.config}
                                />
                        </div>
                    )}
                </>
                )}
                {!this.props.dealTrackerOnly && !this.state.transition && (
                <Grid item xs="12">
                <>
                    {(this.state.selected === null) && (
                    <>
                    <Grid container xs="12" style={{marginTop:10}}>
                        <Grid item xs={.5} style={{margin:10}}>
                            <div style={{display:'flex',alignContent:'center',justifyContent:'center'}}>
                                <TemplateButtonIcon onClick={this.add} style={{width:50}}
                                    label={<AddBoxIcon/>}/>
                            </div>
                        </Grid>
                        <Grid item xs={1} style={{margin:10}}>
                            <TemplateButton onClick={this.toggleDrawer} label='Filters'/>
                        </Grid>
                        <Grid item xs={3} style={{margin:10}}>
                            <div style={{display:"flex",justifyContent:"center",alignContent:"center"}}>
                                <TemplateTextField type="text" id="normal-field" onChange={this.searchUpdate}
                                label="Search" value={this.state.search}/>
                                <TemplateButtonIcon style={{mt:20,height:30,width:30}} label={<SearchIcon size="small"/>} onClick={this.search}/>
                            </div>
                        </Grid>
                        <Grid item xs={3}></Grid>
                        <Grid item xs={1.5} style={{margin:10}}>
                            <div style={{display:'flex',alignContent:'center',justifyContent:'center'}}>
                                <div style={{display:'flex',justifyContent:"spread-evenly"}}>
                                    <TemplateButtonIcon disabled={this.state.massSel.length < 1} onClick={this.transition} size="small" label={<InputIcon/>}/>
                                    <TemplateButtonIcon onClick={this.dncReport} style={{marginLeft:5}} size="small" label={<DoNotDisturbIcon/>}/>
                                    <TemplateButtonIcon onClick={this.providerReport} size="small" style={{marginLeft:5}} label={<AssessmentIcon/>}/>
                                    <TemplateButtonIcon onClick={() => this.reload()} style={{marginLeft:5}} 
                                        label={<AutorenewIcon/>}/>
                                </div>
                            </div>
                        </Grid>
                        <Grid item xs={2} style={{height:50}}>
                            {(this.props.currentUser && this.props.currentUser.entitlements && 
                            this.props.currentUser.entitlements.includes('Admin'))  && ( 
                            <div style={{display:'flex',alignContent:'center',justifyContent:'center'}}>
                                <TemplateCheckbox 
                                      onClick={this.showAllRecords} label="Show All?" checked={!this.state.mine}/>
                            </div>
                            )}
                        </Grid>
                    </Grid>
                    <Grid container xs="12" style={{marginTop:10}}>
                        <Grid item xs="12">
                            <>
                            {(this.props.registrationsAdminList && this.props.registrationsAdminList.data && 
                              this.props.registrationsAdminList.data.registrations && 
                              this.props.registrationsAdminList.data.registrations.length > 0)&& ( 
                                <PainTable
                                    keyField='id' 
                                    selectAll={true}
                                    data={this.props.registrationsAdminList.data.registrations} 
                                    total={this.props.registrationsAdminList.data.total}
                                    page={this.state.page}
                                    pageSize={this.state.pageSize}
                                    onPageChange={this.pageChange}
                                    onMassChange={this.onMassChange}
                                    onSort={this.sortChange}
                                    onPageGridsPerPageChange={this.pageGridsChange}
                                    columns={regheads}>
                                </PainTable> 
                            )}
                            </>
                        </Grid>
                     </Grid> 
                    </>
                    )}
                    {(this.state.selected !== null ) && (
                    <>
                        <RegistrationsEdit selected={this.state.selected} onSave={this.save} onCancel={this.close}/>
                    </>
                    )}
                </>
                </Grid>                
                )}
            </>
            </Grid>
            </Box>
        </>
        )
    }
}

function mapStateToProps(store) {
    return {
        currentUser: store.auth.currentUser,
        registrationsAdminList: store.registrationsAdminList,
        registrationReport: store.registrationReport,
        registrationAdminUpdate: store.registrationAdminUpdate,
        plansList: store.plansList
    }
}

export default connect(mapStateToProps)(Registrations);
