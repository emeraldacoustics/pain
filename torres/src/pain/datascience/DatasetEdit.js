import React, { Component } from 'react';
import { connect } from 'react-redux';
import Grid from '@mui/material/Grid';
import { ReactFlow, Background, Controls,MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Container from '@mui/material/Container';
import TemplateSelect from '../utils/TemplateSelect';
import TemplateTextField from '../utils/TemplateTextField';
import TemplateCheckbox from '../utils/TemplateCheckbox';
import TemplateSelectMulti from '../utils/TemplateSelectMulti';
import TemplateButton from '../utils/TemplateButton';
import moment from 'moment';
import Box from '@mui/material/Box';
import translate from '../utils/translate';
import AppSpinner from '../utils/Spinner';

class QueryEdit extends Component {
    constructor(props) { 
        super(props);
        this.state = { 
            selected: null,
            edges:[],
            nodes:[]
        }
        this.onItemChange = this.onItemChange.bind(this);
        this.generateFlow = this.generateFlow.bind(this);
        this.onOperationChange = this.onOperationChange(this);
        this.columnOptions = this.columnOptions.bind(this);
    } 

    componentWillReceiveProps(p) { 
    }

    componentDidMount() {
        this.state.selected = JSON.parse(JSON.stringify(this.props.selected));
        this.setState(this.state);
        this.generateFlow()
    }

    columnOptions() { 
        var ret = [];
        var t = this.state.selected.tables;
        var c = 0;
        for (c = 0; c < t.length; c++) { 
            var tbl = t[c]
            var d = 0;
            for (d = 0; d < this.props.dataScienceMetadata.data.table_data[tbl].columns.length; d++) { 
                ret.push({
                    label:this.props.dataScienceMetadata.data.table_data[tbl].columns[d].name,
                    value:this.props.dataScienceMetadata.data.table_data[tbl].columns[d].name,
                })
            } 
        } 
        return ret;
    } 

    generateFlow() { 
        this.state.nodes = []
        this.state.edges = []
        var c = 0;
        var x = 50;
        var y = 100;
        
        /* Columns here */
        for (c = 0; c < this.state.selected.columns.length; c++) { 
            this.state.nodes.push({
                id: this.state.selected.columns[c].table + "." + this.state.selected.columns[c].field,
                data: { label: this.state.selected.columns[c].field, table: this.state.selected.columns[c].table },
                position:{x:x,y:y}
            })
            this.state.edges.push({
                id:'edge-' + this.state.selected.columns[c].table + "." + this.state.selected.columns[c].field,
                type:'floating',
                source:this.state.selected.columns[c].table + "." + this.state.selected.columns[c].field,
                target:this.state.selected.columns[c].table,
            })
            y += 30;
        } 
        /* tables here */
        var x = 250;
        var y = 150;
        for (c = 0; c < this.state.selected.tables.length; c++) { 
            this.state.nodes.push({
                id: this.state.selected.tables[c],
                data: { label: this.state.selected.tables[c] },
                position:{x:x,y:y}
            })
            y += 30;
        } 
        this.setState(this.state);
    } 

    onOperationChange(e,n,t) { 
    } 

    onItemChange(n,e,t) { 
        if (e.target && e.target.value) { 
            this.state.selected[n] = e.target.value
        } else { 
            this.state.selected[n] = e
        } 
        this.setState(this.state);
        this.generateFlow()
    } 

    render() {
        return (
        <>
        <Box style={{margin:0}}>
            {(this.state.selected) && (
            <>
            <Grid container xs="12">
                <Grid item xs="3">
                    <div style={{overflow:"auto"}}>
                    <Grid container xs="12">
                        <Grid item xs="12">
                              <TemplateTextField label="Name" style={{width:"98%"}} 
                                onChange={(e,t) => this.onItemChange("name",e,t)} value={this.props.selected.name}/>
                        </Grid>
                    </Grid>
                    <Grid container xs="12">
                        <Grid item xs="12">
                          <TemplateSelectMulti
                              closeMenuOnSelect={true}
                              label='Tables'
                              selectAllOption={false}
                              onChange={(e,t) => this.onItemChange("tables",e,t)}
                              value={this.state.selected.tables.map((g) => { 
                                return (
                                    {
                                        label:g
                                    }
                                )
                              })}
                              options={this.props.dataScienceMetadata.data.tables.map((g) => { 
                                return (
                                    { 
                                    label: g,
                                    value: g
                                    }
                                )
                              })}
                            />
                        </Grid>
                    </Grid>
                    <Grid container xs="12">
                        <Grid item xs="12">
                          <TemplateSelectMulti
                              closeMenuOnSelect={true}
                              label='Columns'
                              selectAllOption={false}
                              onChange={(e,t) => this.onItemChange("columns",e,t)}
                              value={this.state.selected.columns.map((g) => { 
                                return (
                                    {
                                        label:g.table + "." + g.field
                                    }
                                )
                              })}
                              options={this.columnOptions()}
                            />
                        </Grid>
                    </Grid>
                    <Grid container xs="12">
                        <Grid item xs="12">
                            {this.state.selected.columns.map((g) => {
                                return (
                                    <Grid container xs="12">
                                        <Grid item xs={8}>
                                            <TemplateTextField value={g.field} readOnly/>        
                                        </Grid>
                                        <Grid item xs={3.5}>
                                          <TemplateSelect
                                              label='Operation'
                                              onChange={(e,t) => this.onOperationChange(g,e,t)}
                                              value={{label:g['function']}}
                                              options={this.props.dataScienceMetadata.data.operations.map((e) => { 
                                                return (
                                                    { 
                                                    label: e.name,
                                                    value: e.name
                                                    }
                                                )
                                              })}
                                            />
                                        </Grid>
                                    </Grid>
                                )
                            })}
                        </Grid>
                    </Grid>
                    </div>
                </Grid>                
                <Grid item xs="9" style={{borderLeft:"1px solid black",overflow:"auto"}}>
                     <div style={{ height: 400,width:"100%" }}>
                          <ReactFlow nodes={this.state.nodes} edges={this.state.edges}>
                            <Background />
                            <Controls />
                            <MiniMap />
                          </ReactFlow>
                    </div>
                </Grid>                
            </Grid>
            <Grid container xs="12" style={{borderTop:"1px solid black",marginTop:20}}>
                <Grid item xs="12" style={{marginTop:10}}>
                    <Grid item xs="12">
                        <TemplateButton onClick={this.props.onSave} disabled={this.state.actionIdx !== null} label="Save"/>
                        <TemplateButton outline style={{marginLeft:10}} onClick={this.props.onCancel} 
                            color="secondary" label="Close"/>
                    </Grid>
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
        dataScienceMetadata: store.dataScienceMetadata
    }
}

export default connect(mapStateToProps)(QueryEdit);
