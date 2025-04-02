import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Col, Row } from 'reactstrap';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { TabContent, TabPane } from 'reactstrap';
import cx from 'classnames';
import classnames from 'classnames';
import Widget from '../../components/Widget';

import s from './default.module.scss';
import translate from '../utils/translate';
import AppSpinner from '../utils/Spinner';
import { getLegalDashboard } from '../../actions/legalDashboard';
import TrendHeroWithStats from './components/TrendHeroWithStats';
import MainChart from './components/charts/MainChart';

class LegalDashboard extends Component {
    constructor(props) { 
        super(props);
        this.state = { 
        }
    } 

    componentWillReceiveProps(p) { 
    }

    componentDidMount() {
        this.props.dispatch(getLegalDashboard())
    }

    render() {
        return (
        <>
            {(this.props.legalDashboard && this.props.legalDashboard.isReceiving) && (
                <AppSpinner/>
            )}
            {(this.props.legalDashboard && this.props.legalDashboard.data && this.props.legalDashboard.data.revenue_month) && (
            <>
            <Row md="12">
                <>
                <Col md="3">
                    <TrendHeroWithStats data={this.props.legalDashboard.data.revenue_month}
                        title="Revenue (month)" num1isdollar={true} num2title="Consults" num2isdollar={false} num3title="Appointments" num3ispercent={false}
                        num4title="Payouts"/>
                </Col>
                </>
            </Row>
            <Row md="12">
            </Row>
            </>
            )}
        </>
        )
    }
}

function mapStateToProps(store) {
    return {
        currentUser: store.auth.currentUser,
        legalDashboard: store.legalDashboard
    }
}

export default connect(mapStateToProps)(LegalDashboard);
