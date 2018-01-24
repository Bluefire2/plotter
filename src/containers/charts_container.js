import React, {Component} from 'react';
import {connect} from 'react-redux';

import Chart from '../components/chart';

class ChartsContainer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            charts: props.charts,
            width: props.chartWidth,
            height: props.chartHeight
        }
    }

    render() {
        const chartElements = this.state.charts.map(chart => {
            return <Chart width={this.state.width} height={this.state.height}
                          variables={chart.variables}
                          minX={chart.minX}
                          maxX={chart.maxX}
                          minY={chart.minY}
                          maxY={chart.maxY}/>
        });
        return (
            <div id="charts">
                {chartElements}
            </div>
        );
    }
}

const mapStateToProps = ({charts, chartWidth, chartHeight}) => {
    return {
        charts,
        chartWidth,
        chartHeight
    };
};

export default connect(mapStateToProps)(ChartsContainer);