import React, { Component } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import Badge from '@mui/material/Badge';
import Chip from '@mui/material/Chip';
import { styled } from '@mui/material/styles';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import Rating, { IconContainerProps } from '@mui/material/Rating';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAltOutlined';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import moment from 'moment';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import AddBoxIcon from '@mui/icons-material/AddBox';
import DeleteIcon from '@mui/icons-material/Delete';
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import { connect } from 'react-redux';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { push } from 'connected-react-router';
import EditIcon from '@mui/icons-material/Edit';
import LaunchIcon from '@mui/icons-material/Launch';
import cx from 'classnames';
import classnames from 'classnames';
import translate from '../utils/translate';
import AppSpinner from '../utils/Spinner';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getOffices } from '../../actions/offices';
import { getContext } from '../../actions/context';
import { officeSave } from '../../actions/officeSave';
// import { officeReportDownload } from '../../actions/officeReportDownload';
import formatPhoneNumber from '../utils/formatPhone';
import PainTable from '../utils/PainTable';
import TemplateSelect from '../utils/TemplateSelect';
import TemplateSelectEmpty from '../utils/TemplateSelectEmpty';
import TemplateSelectMulti from '../utils/TemplateSelectMulti';
import TemplateTextField from '../utils/TemplateTextField';
import TemplateTextArea from '../utils/TemplateTextArea';
import TemplateCheckbox from '../utils/TemplateCheckbox';
import TemplateButton from '../utils/TemplateButton';
import TemplateButtonIcon from '../utils/TemplateButtonIcon';
import TemplateBadge from '../utils/TemplateBadge';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Navbar from '../../components/Navbar';
import LocationCard from '../office/LocationCard';
import UserCard from '../office/UserCard';
import { useState } from 'react';
import ContactCard from '../office/ContactCard';

const cardStyle = {
    height: '100%',
    borderRadius:5,
    '&:hover': {
        backgroundColor: '#FFFAF2',
    },
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '16px',
    boxSizing: 'border-box'
};

const StyledRating = styled(Rating)(({ theme }) => ({
  '& .MuiRating-iconEmpty .MuiSvgIcon-root': {
    color: theme.palette.action.disabled,
  },
}));

const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#f5f5f9',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 420,
    fontSize: theme.typography.pxToRem(12),
    border: '1px solid #dadde9',
  },
}));

class OfficeList extends Component {

    constructor(props) { 
        super(props);
        this.state = {  
            addUserButton:true,
            addOfficeButton:true,
            addContactButton:true,
            selected: null,
            subTab: "comments",
            filter: [],
            altFilter: [],
            comments:[],
            commentAdd:false,
            addrState:{},
            statusSelected:null,
            search:null,
            selProvider:null,
            page: 0,
            pageSize: 10,
            selectedID: 0
        } 
        this.cancel = this.cancel.bind(this);
        this.comment = this.comment.bind(this);
        this.editAddress = this.editAddress.bind(this);
        this.editUser = this.editUser.bind(this);
        this.changeAccountSummary = this.changeAccountSummary.bind(this);
        this.search = this.search.bind(this);
        this.searchUpdate = this.searchUpdate.bind(this);
        this.pageChange = this.pageChange.bind(this);
        this.priorityChange = this.priorityChange.bind(this);
        this.donotCallChange = this.donotCallChange.bind(this);
        this.sortChange = this.sortChange.bind(this);
        this.showMore = this.showMore.bind(this);
        this.showLess = this.showLess.bind(this);
        this.cancelComment = this.cancelComment.bind(this);
        this.saveComment = this.saveComment.bind(this);
        this.pageGridsChange = this.pageGridsChange.bind(this);
        this.activeChange = this.activeChange.bind(this);
        this.officeReport = this.officeReport.bind(this);
        this.reload = this.reload.bind(this);
        this.toggleSubTab = this.toggleSubTab.bind(this);
        this.onStatusFilter = this.onStatusFilter.bind(this);
        this.onLanguageChange = this.onLanguageChange.bind(this);
        this.onStatusChange = this.onStatusChange.bind(this);
        this.websiteChange = this.websiteChange.bind(this);
        this.onCommissionChange = this.onCommissionChange.bind(this);
        this.onSetterChange = this.onSetterChange.bind(this);
        this.save = this.save.bind(this);
        this.delGrid = this.delGrid.bind(this);
        this.addAddress = this.addAddress.bind(this);
        this.addUser = this.addUser.bind(this);
        this.nameChange = this.nameChange.bind(this);
        this.dbaChange = this.dbaChange.bind(this);
        this.bnChange = this.bnChange.bind(this);
        this.emailChange = this.emailChange.bind(this);
        this.addContact = this.addContact.bind(this);
        this.editContact = this.editContact.bind(this);
        this.saveContact = this.saveContact.bind(this);
    } 

    componentWillReceiveProps(p) { 
        var changed = false;
        if (p.offices.data && p.offices.data.config && 
            p.offices.data.config.provider_status && 
            this.state.statusSelected === null && this.state.selProvider === null) { 
            var c = 0;
            var t = [];
            var t1 = [];
            for (c = 0; c < p.offices.data.config.provider_status.length; c++) { 
                if (p.offices.data.config.provider_status[c].name !== 'IN_NETWORK') { continue; }
                t.push(p.offices.data.config.provider_status[c]); 
                t1.push(p.offices.data.config.provider_status[c].id); 
            } 
            this.state.statusSelected = t;
            this.state.filter = t1;
            this.setState(this.state);
            changed = true;
        } 
        if (changed) { this.reload(); } 
    }


    componentDidMount() {
        var i = null;
        this.props.dispatch(getOffices({
            limit:this.state.pageSize,
            office_id:i,
            offset:this.state.page
        }));
    }

    addComment() { 
        this.state.selected.comments.unshift({text:'',edit:true})
        this.state.commentAdd = true;
        this.setState(this.state);
    }

    saveComment(e) { 
        this.state.selected.comments[0].edit=false;
        this.state.commentAdd = false;
        this.setState(this.state);
    }

    cancelComment(e) { 
        this.state.selected.comments.shift();
        this.setState(this.state);
    }

    editUser(e,t) { 
        var v = this.state.selected.users.findIndex((f) => f.id === e.id)
        if (v < 0) { 
            this.state.selected.users.push(e);
        } else { 
            this.state.selected.users[v] = e;
        } 
        this.state.addUserButton = false;
        this.setState(this.state)
    } 

    editContact(e,t) { 
        var v = this.state.selected.phones.findIndex((f) => f.id === e.id)
        if (v < 0) { 
            this.state.selected.phones.push(e);
        } else { 
            this.state.selected.phones[v] = e;
        } 
        this.state.addContactButton = false;
        this.setState(this.state)
    } 

    editAddress(e,t) { 
        var v = this.state.selected.addr.findIndex((f) => f.id === e.id)
        if (v < 0) { 
            this.state.selected.addr.push(e);
        } else { 
            this.state.selected.addr[v] = e;
        } 
        this.state.addOfficeButton = false;
        this.setState(this.state)
    } 

    saveContact() { 
        this.state.addContactButton = true;
        this.setState(this.state)
    } 

    comment(e) { 
        this.state.selected.comments[0].text=e.target.value
        this.setState(this.state);
    }

    showMore(r) { 
        this.state.comments.id = 1;
        this.setState(this.state);
    } 

    showLess(r) { 
        delete this.state.comments.id;
        this.setState(this.state);
    } 

    reload() { 
        this.props.dispatch(getOffices(
            {office_id:this.state.selProvider,sort:this.state.sort,direction:this.state.direction,
             search:this.state.search,limit:this.state.pageSize,
            offset:this.state.page,status:this.state.filter,}
        ));
    }

    priorityChange(e,t) { 
        this.state.selected.priority = e.target.value;
        this.setState(this.state);
    }

    donotCallChange(e,t) { 
        this.state.selected.do_not_contact = this.state.selected.do_not_contact ? 0 : 1; 
        this.setState(this.state);
    }

    websiteChange(e,t) { 
        this.state.selected.website = e.target.value;
        this.setState(this.state);
    }

    activeChange(e,t) { 
        this.state.selected.active = this.state.selected.active ? 0 : 1; 
        this.setState(this.state);
    }

    officeReport() { 
        this.props.dispatch(getOffices(
            {report:'office_report',sort:this.state.sort,direction:this.state.direction,
             search:this.state.search,limit:this.state.pageSize,
            offset:this.state.page,status:this.state.filter}
        ));
    } 

    onStatusChange(e,t) { 
        var g = this.props.offices.data.config.provider_status.filter((g) => g.name === e.target.value)
        if (g.length > 0) { 
            this.state.selected.pq_status_id = g[0].id;
            this.state.selected.status = g[0].name;
        } 
        this.setState(this.state);
    }

    onSetterChange(e,t) { 
        this.state.selected.setter_name = e.target.value;
        this.state.selected.setter_user_id = 
            this.props.offices.data.config.commission_users.filter((g) => g.name === e.target.value)[0].id
        this.setState(this.state);
    }

    onCommissionChange(e,t) { 
        this.state.selected.commission_name = e.target.value;
        this.state.selected.commission_user_id = 
            this.props.offices.data.config.commission_users.filter((g) => g.name === e.target.value)[0].id
        this.setState(this.state);
    }

    onLanguageChange(e,t) { 
        var c = 0;
        var t = [];
        for (c = 0; c < e.length; c++) { 
            var b = this.props.offices.data.config.languages.filter((f) => f.name === e[c].label)
            t.push(b[0].id); 
        } 
        this.state.selected.languages = t;
        this.setState(this.state)
        this.reload();
    } 

    onStatusFilter(e,t) { 
        if (e.length < 1 ) { return; }
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
        this.reload();
    } 

    sortChange(t) { 
        var g = this.props.offices.data.sort.filter((e) => t.dataField === e.col);
        if (g.length > 0) { 
            g = g[0]
            this.state.sort = g.id
            this.state.direction = g.direction === 'asc' ? 'desc' : 'asc'
            this.props.dispatch(getOffices(
                {direction:this.state.direction,sort:this.state.sort,search:this.state.search,limit:this.state.pageSize,offset:this.state.page,status:this.state.filter}
            ));
            this.setState(this.state);
        } 
    } 

    pageGridsChange(t) { 
        this.state.pageSize = t
        this.state.page = 0
        this.props.dispatch(getOffices(
            {direction:this.state.direction,sort:this.state.sort,search:this.state.search,limit:this.state.pageSize,offset:this.state.page,status:this.state.filter}
        ));
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
    pageChange(e) { 
        this.state.page = e
        this.props.dispatch(getOffices(
            {direction:this.state.direction,sort:this.state.sort,search:this.state.search,limit:this.state.pageSize,offset:this.state.page,status:this.state.filter}
        ));
        this.setState(this.state);
    } 

    delGrid(e) { 
        var t = this.state.selected.addr.filter((g) => g.id !== e.id);
        this.state.selected.addr = t;
        this.setState(this.state);
    } 
    toggleSubTab(e,t) { 
        this.state.subTab = t;
        this.setState(this.state);
    } 
    addUser() { 
        this.state.selected.users.push({
            first_name:'',
            last_name:'',
            email:'',
            phone:''
        })
        this.state.addUserButton = true;
        this.setState(this.state);
    } 

    addContact() { 
        this.state.addContactButton = false;
        this.state.selected.phones.push({
            phone:'',
            description:'',
            iscell:false,
        })
        this.setState(this.state);
    } 

    addAddress() { 
        this.state.selected.addr.push({
            name:'',
            addr1:'',
            city:'',
            state:'',
            zipcode:'',
            phone:''
        })
        this.state.addOfficeButton = false; 
        this.setState(this.state);
    } 
    getContext(e) { 
        this.props.dispatch(getContext({office:e.id},function(err,args) { 
                localStorage.setItem("context",true);
                window.location.href = '/app';
        }))
    } 

    edit(row) { 
        var r = {}
        if (row.id === 'new') { 
            r = { 
                name:'',
                ein_number: '',
                email:'',
                addr: [{ 
                    phone:'',
                    addr1:'',
                    addr2:'',
                    city:'',
                    state:'',
                    zipcode:''
                }]
            }
        } else { 
            r = JSON.parse(JSON.stringify(row));
        } 
        this.state.selected=r
        this.setState(this.state);
    } 
    dbaChange(e) { 
        this.state.selected.doing_business_as_name = e.target.value;
        this.setState(this.state);
    } 
    bnChange(e) { 
        this.state.selected.business_name = e.target.value;
        this.setState(this.state);
    } 
    nameChange(e) { 
        this.state.selected.name = e.target.value;
        this.setState(this.state);
    } 
    emailChange(e) { 
      this.state.selected.email = e.target.value;
      this.setState(this.state);
      //validate email 
      const emailRegex = /^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
      this.state.isValid = emailRegex.test(e.target.value);
      if (this.state.isValid || e.target.value === '') {
          this.setState(prevState => ({
              ...prevState.selected,
              email: e.target.value,
              errorMessage: '',
          }));
      } else {
          this.setState({ errorMessage: 'Invalid email format' });
      }
  } 
    cancel() { 
        this.state.selected = null;
        this.setState(this.state);
    } 
    changeAccountSummary(e) { 
        this.state.selected.account_summary = e.target.value;
        this.setState(this.state);
    } 
    save() { 
        var g = this.state.selected;
        if (g.id === 'new') { 
            delete g['id']
        }
        if (!g.name || !g.email) {  
            toast.error('Please fill all the fields.',
                {
                    position:"top-right",
                    autoClose:3000,
                    hideProgressBar:true
                }
            );
            return;
          }
        this.props.dispatch(officeSave(g,function(err,args) { 
            args.props.dispatch(
                getOffices(
                  {limit:args.state.pageSize,offset:args.state.page,status:args.state.filter},
                  function(err,args) { 
                  toast.success('Successfully saved office.',
                    {
                        position:"top-right",
                        autoClose:3000,
                        hideProgressBar:true
                    }
                  );
                  args.cancel()
                },args))
        },this));
    } 

    addGrid() { 
        this.state.selected.addr.push({
            id:0,phone:'',addr1:'',addr2:'',city:'',state:'',zipcode:''
        })
        this.setState(this.state);
    } 

    render() {
        var phonesheads = [
            {
                dataField:'id',
                text:'ID'
            },
            {
                dataField:'phone',
                text:'Phone',
                formatter:(cellContent,row) => (
                    <div>
                        {formatPhoneNumber(row['phone'])}
                    </div>
                )
            },
            {
                dataField:'created',
                align:'center',
                text:'Created',
                formatter:(cellContent,row) => (
                    <div>
                        {moment(row['created']).format('lll')} 
                    </div>
                )
            },
            
        ]
        var clientheads = [
            {
                dataField:'id',
                text:'ID'
            },
            {
                dataField:'email',
                text:'Email'
            },
            {
                dataField:'first_name',
                text:'Name',
                formatter:(cellContent,row) => (
                    <div>
                        {row['first_name'] + " " + row['last_name']}
                    </div>
                )
            },
            {
                dataField:'phone',
                text:'Phone',
                formatter:(cellContent,row) => (
                    <div>
                        {formatPhoneNumber(row['phone'])}
                    </div>
                )
            },
            {
                dataField:'created',
                align:'center',
                text:'Created',
                formatter:(cellContent,row) => (
                    <div>
                        {moment(row['created']).format('lll')} 
                    </div>
                )
            },
            
        ]
        var cardheads = [
            {
                dataField:'id',
                text:'ID'
            },
            {
                dataField:'brand',
                text:'Brand'
            },
            {
                dataField:'last4',
                text:'last4'
            },
            {
                dataField:'exp_year',
                align:'left',
                text:'Expires',
                formatter:(cellContent,row) => (
                    <div>
                        {row['exp_month'] + "/" + row['exp_year']}
                    </div>
                )
            },
            {
                dataField:'created',
                align:'center',
                text:'Created',
                formatter:(cellContent,row) => (
                    <div>
                        {moment(row['created']).format('lll')} 
                    </div>
                )
            },
            
        ]
        var historyheads = [
            {
                dataField:'id',
                hidden:true,
                text:'ID'
            },
            {
                dataField:'user',
                text:'Changed By'
            },
            {
                dataField:'text',
                align:'left',
                text:'Message'
            },
            {
                dataField:'created',
                align:'center',
                text:'Created',
                formatter:(cellContent,row) => (
                    <div>
                        {moment(row['created']).format('lll')} 
                    </div>
                )
            },
            
        ]
        var heads = [
            {
                dataField:'id',
                hidden:true,
                onClick: (content,row) => (
                    this.edit(content)
                ),
                text:'ID'
            },
            {
                dataField:'name',
                onClick: (content,row) => (
                    this.edit(content)
                ),
                text:'Name',
                formatter:(cellContent,row) => (
                    <div>
                        <div style={{display:"flex",justifyContent:"space-between"}}>
                            <div>
                            {row['name']}
                            </div>
                            <div></div>
                            <div style={{display:"flex",justifyContent:"space-around"}}>
                                <HtmlTooltip placement="bottom" title={
                                    <>
                                    <h6 style={{ fontFamily: "'Montserrat', sans-serif"}} >Score: {row.weighted_score}</h6>
                                    <div style={{m:0,p:0,backgroundColor:"white",color:"black"}}>
                                        <table>
                                            <tr><th>Key</th><th>Value</th></tr>
                                            {row.score_components.map((f) => { 
                                                return(
                                                    <tr>
                                                    <td>{f.key}</td>
                                                    <td>{f.value}</td>
                                                    </tr>
                                                )
                                            })}
                                        </table>
                                    </div>
                                    </>
                                    }>
                                    {row.weighted_score < 1 && (
                                    <>
                                        <SentimentVerySatisfiedIcon color="success" />,
                                    </>
                                    )}
                                    {row.weighted_score >= 1 && row.weighted_score < 2 && (
                                    <>
                                        <SentimentSatisfiedIcon color="success" />
                                    </>
                                    )}
                                    {row.weighted_score >= 2 && row.weighted_score < 3 && (
                                    <>
                                        <SentimentDissatisfiedIcon color="warning" />
                                    </>
                                    )}
                                    {row.weighted_score >= 3 && row.weighted_score < 4 && (
                                    <>
                                        <SentimentVeryDissatisfiedIcon color="error" />
                                    </>
                                    )}
                                    {row.weighted_score >= 4 && row.weighted_score < 5 && (
                                    <>
                                        <SentimentVeryDissatisfiedIcon color="error" />
                                    </>
                                    )}
                                    {row.weighted_score > 5 && (
                                    <>
                                        <SentimentVeryDissatisfiedIcon color="error" />
                                    </>
                                    )}
                                </HtmlTooltip>
                                <Chip color="secondary" style={{marginLeft:5}} label={row.clients.length + "c"}/>
                            </div>
                        </div>
                    </div>
                )
            },
            {
                dataField:'first_name',
                align:'center',
                text:'Contact',
                onClick: (content,row) => (
                    this.edit(content)
                ),
                formatter:(cellContent,row) => (
                    <div>
                        {row.first_name + " " + row.last_name}
                    </div>
                )
            },
            {
                dataField:'city',
                align:'center',
                text:'City',
                onClick: (content,row) => (
                    this.edit(content)
                ),
            },
            {
                dataField:'state',
                align:'center',
                text:'State',
                onClick: (content,row) => (
                    this.edit(content)
                ),
            },
            {
                dataField:'commission_name',
                align:'center',
                text:'Assignee',
                onClick: (content,row) => (
                    this.edit(content)
                ),
            },
            {
                dataField:'status',
                align:'center',
                text:'Status',
                onClick: (content,row) => (
                    this.edit(content)
                ),
                formatter:(cellContent,row) => (
                    <div>
                        {(row.status === 'IN_NETWORK') && (<TemplateBadge label='IN_NETWORK'/>)}
                        {(row.status === 'APPROVED') && (<TemplateBadge label='APPROVED'/>)}
                        {(row.status === 'QUEUED') && (<TemplateBadge label='QUEUED'/>)}
                        {(row.status === 'WAITING') && (<TemplateBadge label='WAITING'/>)}
                        {(row.status === 'DENIED') && (<TemplateBadge label='DENIED'/>)}
                    </div>
                )
            },
            {
                dataField:'office_type',
                align:'center',
                onClick: (content,row) => (
                    this.edit(content)
                ),
                text:'Office Type'
            },
            {
                dataField:'id',
                text:'Actions',
                formatter:(cellContent,row) => ( 
                    <div>
                        <TemplateButtonIcon onClick={() => this.getContext(row)} style={{height:35,width:30}} label={<LaunchIcon/>}/>
                    </div>
                )
            },
        ];
        var potheads = [
            {
                dataField:'id',
                hidden:true,
                text:'ID'
            },
            {
                dataField:'name',
                hidden:false,
                text:'name'
            },
            {
                dataField:'addr',
                hidden:false,
                text:'Address',
                formatter:(cc,r) => (
                    <div>
                        {r.addr1 + " " + r.city + ', ' + r.state}
                    </div>
                )
            },
            {
                dataField:'phone',
                hidden:false,
                text:'Phone',
            },
            {
                dataField:'website',
                hidden:false,
                text:'Website',
            },
        ]
        var offheads = [
            {
                dataField:'id',
                hidden:true,
                text:'ID'
            },
            {
                dataField:'name',
                text:'Name'
            },
            {
                dataField:'phone',
                text:'Phone'
            },
            {
                dataField:'addr1',
                text:'Address'
            },
            {
                dataField:'city',
                text:'City'
            },
            {
                dataField:'state',
                text:'state'
            },
            {
                dataField:'zipcode',
                text:'Zipcode'
            },
            {
                dataField:'id',
                text:'Actions',
                editable: false,
                formatter:(cellContent,row) => ( 
                    <div>
                        <TemplateButtonIcon onClick={() => this.delGrid(row)} style={{marginRight:5,height:35,width:90}} label={<DeleteIcon/>}/>
                    </div>
                )
            },
        ]
        var planheads = [
            {
                dataField:'id',
                hidden:true,
                text:'ID'
            },
            {
                dataField:'description',
                editable:true,
                text:'Description'
            },
            {
                dataField:'quantity',
                align:'center',
                editable:true,
                width:50,
                text:'quantity'
            },
            {
                dataField:'price',
                text:'Price',
                editable:true,
                align:'right',
                formatter: (cellContent,row) => (
                    <div>
                        ${row.price.toFixed ?  row.price.toFixed(2) : row.price}
                    </div>
                )
            },
            
        ]
        var invheads = [
            {
                dataField:'id',
                text:'ID'
            },
            {
                dataField:'stripe_invoice_id',
                text:'Link',
                formatter: (cellContent,row) => (
                    <div>
                        <a style={{color:'black'}} href={'https://dashboard.stripe.com/invoices/' + row.stripe_invoice_id}
                            target='_blank'>{row.stripe_invoice_id}</a>
                    </div>
                )
            },
            {
                dataField:'status',
                align:'center',
                text:'Status'
            },
            {
                dataField:'stripe_status',
                align:'center',
                text:'Prov Status'
            },
            {
                dataField:'billing_period',
                'align':'center',
                text:'Period'
            },
            {
                dataField:'total',
                text:'Total',
                align:'right',
                formatter: (cellContent,row) => (
                    <div>
                        {row.total.toFixed ? '$' + row.total.toFixed(2) : row.total}
                    </div>
                )
            }
        ]


        return (
          
        <>
            {(this.props.offices && this.props.offices.isReceiving) && (
                <AppSpinner/>
            )}
            {(this.props.context && this.props.context.isReceiving) && (
                <AppSpinner/>
            )}
            {(this.props.officeSave && this.props.officeSave.isReceiving) && (
                <AppSpinner/>
            )}
            {(this.props.officeReportDownload && this.props.officeReportDownload.isReceiving) && (
                <AppSpinner/>
            )}
            <Box style={{margin:0}}>
            {(this.state.selected === null) && (
            <Grid container xs="12">
                <Grid item xs="3" style={{zIndex:9995,margin:10}}>
                  {(this.props.offices && this.props.offices.data && 
                    this.props.offices.data.config &&
                    this.props.offices.data.config.provider_status && this.state.statusSelected !== null) && (
                      <TemplateSelectMulti
                          closeMenuOnSelect={true}
                          label='Status'
                          onChange={this.onStatusFilter}
                          value={this.state.statusSelected.map((g) => { 
                            return (
                                {
                                label:this.props.offices.data.config.provider_status.filter((f) => f.id === g.id).length > 0 ? 
                                    this.props.offices.data.config.provider_status.filter((f) => f.id === g.id)[0].name : '',
                                id:this.props.offices.data.config.provider_status.filter((f) => f.id === g.id).length > 0 ? 
                                    this.props.offices.data.config.provider_status.filter((f) => f.id === g.id)[0].id : ''
                                }
                            )
                          })}
                          options={this.props.offices.data.config.provider_status.map((e) => { 
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
                <Grid item xs={3} style={{margin:10}}>
                  {(this.props.offices && this.props.offices.data && 
                    this.props.offices.data.config &&
                    this.props.offices.data.config.provider_status && this.state.statusSelected !== null) && (
                        <div style={{display:"flex",justifyContent:"space-around",alignContent:"center"}}>
                            <TemplateTextField type="text" id="normal-field" onChange={this.searchUpdate}
                            label="Search" value={this.state.search}/>
                            <TemplateButtonIcon style={{mt:10,height:30,width:30}} label={<SearchIcon size="small"/>} onClick={this.search}/>
                        </div>
                  )}
                </Grid>
                <Grid item xs={3}></Grid>
                <Grid item xs={2}>
                  {(this.props.offices && this.props.offices.data && 
                    this.props.offices.data.config &&
                    this.props.offices.data.config.provider_status && this.state.statusSelected !== null) && (
                    <div style={{display:'flex',alignContent:'center',justifyContent:'center'}}>
                        <div style={{justifyContent:'space-between'}}>
                            <TemplateButtonIcon onClick={() => this.reload()} style={{width:35}}
                                label={<AutorenewIcon/>}/>
                            <TemplateButtonIcon onClick={this.officeReport} style={{width:35}} label={<AssessmentIcon/>}/>
                        </div>
                    </div>
                    )}
                </Grid>
            </Grid>
            )}
            {(this.props && this.props.offices && this.props.offices.data && this.props.offices.data.offices &&
              this.props.offices.data.offices.length > 0 && this.state.selected === null) && ( 
            <>
            <Grid container xs="12" style={{marginTop:10}}>
                <Grid item xs="12">
                      <PainTable
                            keyField='id' 
                            data={this.props.offices.data.offices} 
                            total={this.props.offices.data.total}
                            page={this.state.page}
                            pageSize={this.state.pageSize}
                            onPageChange={this.pageChange}
                            onSort={this.sortChange}
                            onPageGridsPerPageChange={this.pageGridsChange}
                            columns={heads}>
                      </PainTable> 
                </Grid>                
            </Grid>
            </>
            )}
            {(this.props && this.props.offices && this.props.offices.data && this.props.offices.data.offices &&
              this.props.offices.data.offices.length > 0 && this.state.selected !== null) && ( 
                <>
                <Grid container xs="12" style={{margin:10}}>
                    <Grid container xs="6">
                        <Grid item xs={12} style={{margin:20}}>
                            <TemplateTextArea label="Account Summary" rows={2} 
                                value={this.state.selected.account_summary} style={{marginRight:10}}
                                onChange={this.changeAccountSummary} 
                            />
                        </Grid>
                        <Grid item xs={2} style={{margin:20}}>
                          <TemplateTextField readOnly label="ID" value={this.state.selected.id}/>
                        </Grid>
                        <Grid item xs={3} style={{margin:20}}>
                          <TemplateTextField readOnly label='Service Start' value={this.state.selected.service_start_date}/>
                        </Grid>
                        <Grid item xs={4} style={{margin:20}}>
                          <TemplateTextField onChange={this.nameChange} label="Name" value={this.state.selected.name}/>
                        </Grid>
                        <Grid item xs={4} style={{margin:20}}>
                          <TemplateTextField onChange={this.bnChange} label="Business Name" value={this.state.selected.business_name}/>
                        </Grid>
                        <Grid item xs={4} style={{margin:20}}>
                          <TemplateTextField onChange={this.dbaChange} label="Doing Business As" value={this.state.selected.doing_business_as_name}/>
                        </Grid>
                        <Grid item xs={4} style={{margin:20}}>
                          <TemplateTextField 
                                  onChange={this.emailChange} label="Email" value={this.state.selected.email}/>
                        </Grid>
                        <Grid item xs={4} style={{margin:20}}>
                            <div style={{display:"flex",justifyContent:"space-between"}}>
                              <TemplateTextField 
                                      onChange={this.websiteChange} label="Website" value={this.state.selected.website}/>
                              <a style={{marginTop:10,color:'green'}} href={this.state.selected.website} target='_blank'><LaunchIcon/></a>
                            </div>
                        </Grid>
                    </Grid>
                    <Grid container xs="6" style={{borderLeft:"1px solid black"}}>
                        <Grid item xs={3} style={{margin:20}}>
                          {(this.props.offices && this.props.offices.data && 
                            this.props.offices.data.config &&
                            this.props.offices.data.config.commission_users) && (
                              <TemplateSelect
                                  label='Status'
                                  onChange={this.onStatusChange}
                                  value={{label:this.state.selected.status}}
                                  options={this.props.offices.data.config.provider_status.map((e) => { 
                                    return (
                                        { 
                                        label: e.name,
                                        value: e.name
                                        }
                                    )
                                  })}
                                />
                            )}
                        </Grid>                
                        <Grid item xs={3} style={{margin:20}}>
                          {(this.props.offices && this.props.offices.data && 
                            this.props.offices.data.config &&
                            this.props.offices.data.config.commission_users) && (
                              <TemplateSelect
                                  label='Commission User'
                                  onChange={this.onCommissionChange}
                                  value={{label:this.state.selected.commission_name}}
                                  options={this.props.offices.data.config.commission_users.map((e) => { 
                                    return (
                                        { 
                                        label: e.name,
                                        name: e.name,
                                        value: e.name
                                        }
                                    )
                                  })}
                                />
                            )}
                        </Grid>                
                        <Grid item xs={3} style={{margin:20}}>
                          {(this.props.offices && this.props.offices.data && 
                            this.props.offices.data.config &&
                            this.props.offices.data.config.commission_users) && (
                              <TemplateSelect
                                  label='Setter User'
                                  onChange={this.onSetterChange}
                                  value={{label:this.state.selected.setter_name}}
                                  options={this.props.offices.data.config.commission_users.map((e) => { 
                                    return (
                                        { 
                                        label: e.name,
                                        name: e.name,
                                        value: e.name
                                        }
                                    )
                                  })}
                                />
                            )}
                        </Grid>                
                        <Grid item xs={4} style={{margin:20}}>
                          <TemplateTextField 
                                  readOnly label="Days in Network" value={this.state.selected.days_in_network}/>
                        </Grid>
                        <Grid item xs={3} style={{margin:20}}>
                          <TemplateSelectMulti
                              closeMenuOnSelect={true}
                              label='Languages'
                              onChange={this.onLanguageChange}
                              value={this.state.selected.languages.map((g) => { 
                                return (
                                    {
                                    label:this.props.offices.data.config.languages.filter((f) => f.id === g).length > 0 ? 
                                        this.props.offices.data.config.languages.filter((f) => f.id === g)[0].name : '',
                                    id:this.props.offices.data.config.languages.filter((f) => f.id === g).length > 0 ? 
                                        this.props.offices.data.config.languages.filter((f) => f.id === g)[0].id : ''
                                    }
                                )
                              })}
                              options={this.props.offices.data.config.languages.map((e) => { 
                                return (
                                    { 
                                    label: e.name,
                                    id: e.name
                                    }
                                )
                              })}
                            />
                        </Grid>
                        <Grid item xs={12} style={{margin:20}}>
                        <TemplateCheckbox 
                              onChange={this.activeChange} label="Active" checked={this.state.selected.active}/>
                        </Grid>
                        <Grid item xs={12} style={{margin:20}}>
                        <TemplateCheckbox 
                            onChange={this.donotCallChange} label="Do not call" checked={this.state.selected.do_not_contact}/>
                        </Grid>
                        <Grid item xs={3} style={{margin:20}}>
                        <TemplateTextField 
                              onChange={this.priorityChange} label="Priority" value={this.state.selected.priority}/>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid container xs="12">
                    <Grid item xs="12">
                        <Tabs style={{marginBottom:30}} value={this.state.subTab} onChange={this.toggleSubTab}>
                            <Tab value='comments' label='Comments' sx={{ color: 'black' }}/>
                            <Tab value='plans' label='Plans'  sx={{ color: 'black' }}/>
                            <Tab value='offices' label='Locations' sx={{ color: 'black' }}/>
                            <Tab value='contact' label='Contact' sx={{ color: 'black' }}/>
                            <Tab value='invoices' label='Invoices' sx={{ color: 'black' }} />
                            <Tab value='clients' label='Clients' sx={{ color: 'black' }}/>
                            <Tab value='users' label='Users' sx={{ color: 'black' }}/>
                            <Tab value='history' label='History' sx={{ color: 'black' }}/>
                        </Tabs>
                        {(this.state.subTab === 'users') && (
                            <>
                                {this.state.addUserButton && ( 
                                <TemplateButtonIcon
                                    style={{ width:50,marginBottom: 10 }}
                                    onClick={this.addUser}
                                    label={<AddBoxIcon />}
                                />
                                )}
                                <Grid container xs={12}>
                                {this.state.selected.users && this.state.selected.users.length > 0 && (
                                    this.state.selected.users.map((u, i) => (
                                    <>
                                        {!u.deleted && (
                                        <Grid item xs={3} style={{margin:20}}>
                                        <UserCard onEdit={this.editUser} key={i} 
                                            provider={u} />
                                        </Grid>
                                        )}
                                    </>
                                    ))
                                )}
                                </Grid>
                            </>
                        )}
                        {this.state.subTab === 'contact' && (
                            <>
                                {(this.state.addContactButton) && (
                                <TemplateButtonIcon
                                    style={{ width:50,marginBottom: 10 }}
                                    onClick={this.addContact}
                                    label={<AddBoxIcon />}
                                />
                                )}
                                <Grid container xs={12}>
                                {this.state.selected.phones && this.state.selected.phones.length > 0 && (
                                    this.state.selected.phones.map((p, i) => (
                                    <>
                                        {!p.deleted && (
                                        <Grid item xs={3} style={{margin:20}}>
                                        <ContactCard onSave={this.saveContact} onEdit={this.editContact} key={i} 
                                            provider={p} />
                                        </Grid>
                                        )}
                                    </>
                                    ))
                                )}
                                </Grid>
                            </>
                        )}    
                        {(this.state.subTab === 'clients') && (
                          <PainTable
                              keyField="id"
                              data={this.state.selected.clients} 
                              columns={ clientheads }/>
                        )}
                        {(this.state.subTab === 'cards') && (
                              <PainTable
                                  keyField="id"
                                  data={this.state.selected.cards} 
                                  columns={ cardheads }/>
                        )}
                        {(this.state.subTab === 'history') && (
                              <PainTable
                                  keyField="id"
                                  data={this.state.selected.history} 
                                  columns={ historyheads }/>
                        )}
                        {(this.state.subTab === 'potentials') && (
                              <PainTable
                                  keyField="id"
                                  data={this.state.selected.potential} 
                                  columns={ potheads }/>
                        )}
                        {(this.state.subTab === 'plans') && (
                        <>
                                {(this.state.selected.plans && this.state.selected.plans.items) && (
                                <>
                                    <Grid container xs="12" style={{marginBottom:20,borderBottom:"1px solid black"}}>
                                        <Grid item xs="2">
                                            Plan Start
                                        </Grid>
                                        <Grid item xs="4">
                                            {this.state.selected.plans.start_date}
                                        </Grid>
                                        <Grid item xs="2">
                                            Plan End
                                        </Grid>
                                        <Grid item xs="4">
                                            {this.state.selected.plans.end_date}
                                        </Grid>
                                    </Grid>
                                    <Grid container xs="12" style={{marginBottom:20}}>
                                        <PainTable
                                            keyField='id' data={this.state.selected.plans.items} 
                                            columns={planheads}/>
                                    </Grid>
                                </>
                                )}
                            </>
                        )}


                        {this.state.subTab === 'offices' && (
                            <>
                                {this.state.addOfficeButton && ( 
                                <TemplateButtonIcon
                                    style={{ width:50,marginBottom: 10 }}
                                    onClick={this.addAddress}
                                    label={<AddBoxIcon />}
                                />
                                )}
                                <Grid container xs={12}>
                                {this.state.selected.addr && this.state.selected.addr.length > 0 && (
                                    this.state.selected.addr.map((address, index) => (
                                    <>
                                        {!address.deleted && (
                                        <Grid item xs={3} style={{margin:20}}>
                                        <LocationCard onEdit={this.editAddress} key={index} 
                                            provider={address} />
                                        </Grid>
                                        )}
                                    </>
                                    ))
                                )}
                                </Grid>
                            </>
                        )}


                        {(this.state.subTab === 'invoices') && (
                        <>
                                {(this.state.selected.invoices && this.state.selected.invoices.length > 0) && (
                                    <PainTable
                                        keyField='id' data={this.state.selected.invoices} 
                                        columns={invheads}/>
                                )}
                        </>
                        )}
                        {(this.state.subTab === 'comments') && (
                        <>
                                <TemplateButtonIcon onClick={() => this.addComment({id:"new"})} label={<AddBoxIcon/>}/>
                                <Grid container xs="12">
                                {this.state.selected.comments.sort((a,b) => (a.created > b.created ? -1:1)).map((e) => { 
                                    return (
                                        <Grid item xs="3" style={{margin:5}} key={e.id}>
                                            <Box sx={{mt:3}}>
                                            <Paper elevation={3} sx={cardStyle}>
                                                <Grid container xs="12">
                                                    <Grid item xs="6">
                                                        <font style={{fontSize:"14pt"}}>
                                                            {
                                                            this.state.selected.assignee.filter((g) => g.id === e.user_id).length > 0 ? 
                                                            this.state.selected.assignee.filter((g) => g.id === e.user_id)[0].first_name + " " +
                                                            this.state.selected.assignee.filter((g) => g.id === e.user_id)[0].last_name + " " : ""
                                                            }
                                                        </font>
                                                    </Grid>
                                                    <Grid item xs="6">
                                                        {moment(e.created).format('lll')}
                                                    </Grid>
                                                </Grid>
                                                <hr/>
                                                <Grid container xs="12">
                                                    {(!e.edit) && ( 
                                                    <Grid item xs="12">
                                                        <div style={{overflow:"auto",height:100,display: 'flex', 
                                                            alignItems: 'left', justifyContent: 'start'}}>
                                                        {e.text}
                                                        </div>
                                                    </Grid>
                                                    )}
                                                    {(e.edit) && ( 
                                                    <Grid item xs="12">
                                                      <Grid item xs={12}>
                                                        <TemplateTextArea rows={5} value={e.text} style={{margin:10}}
                                                            onChange={this.comment} 
                                                        />
                                                      </Grid>
                                                    </Grid>
                                                    )}
                                                </Grid>
                                                <Grid container xs="12">
                                                    {(e.edit) && ( 
                                                    <Grid item xs="12">
                                                        <div style={{display:"flex",justifyContent:"center"}}>
                                                            <div style={{display:"flex",justifyContent:"spread-evenly"}}>
                                                            <TemplateButtonIcon onClick={this.saveComment} label={<SaveIcon/>}/>
                                                            <TemplateButtonIcon outline style={{marginLeft:10}} 
                                                                onClick={this.cancelComment} label={<CancelIcon/>}/>
                                                            </div>
                                                        </div>
                                                    </Grid>
                                                    )}
                                                </Grid>
                                            </Paper>
                                            </Box>
                                        </Grid>
                                    )})}
                                </Grid>
                            </>
                            )}
                    </Grid>
                </Grid>
                <hr/>
                <Grid container xs="12" style={{marginTop:20}}>
                    <Grid item xs="6">
                        <TemplateButton onClick={this.save} color="primary" disabled={!this.state.selected.name || !this.state.selected.email || 
                          this.state.errorMessage || this.state.phoneMessage} label='Save'/>
                        <TemplateButton outline style={{marginLeft:10}} onClick={this.cancel} label='Cancel'/>
                    </Grid>
                </Grid>
            </>
            )}
            </Box>
        </>
        )
    }
}

function mapStateToProps(store) {
    return {
        currentUser: store.auth.currentUser,
        officeSave: store.officeSave,
        officeReportDownload: store.officeReportDownload,
        plansList: store.plansList,
        context: store.context,
        offices: store.offices
    }
}

export default connect(mapStateToProps)(OfficeList);
