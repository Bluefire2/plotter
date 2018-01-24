import React, {Component} from 'react';
import {connect} from 'react-redux';

import Chart from '../components/chart';

class ChartsContainer extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let chartElements;
        if(this.props.charts) {
            chartElements = this.props.charts.map(chart => {
                return <Chart width={this.props.width} height={this.props.height}
                              variables={chart.variables}
                              minX={chart.minX}
                              maxX={chart.maxX}
                              minY={chart.minY}
                              maxY={chart.maxY}/>
            });
        } else {
            chartElements = null;
        }
        return (
            <div id="charts">
                {chartElements}
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        charts: state.charts,
        width: state.chartWidth,
        height: state.chartHeight
    };
};

export default connect(mapStateToProps)(ChartsContainer);