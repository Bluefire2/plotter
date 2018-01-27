import React, {Component} from 'react';
import {select} from 'd3';
import {connect} from 'react-redux';

import Chart from '../components/chart';

class ChartsContainer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            chartWidth: 0
        };
        this.adjustChartWidth = this.adjustChartWidth.bind(this);
    }

    adjustChartWidth() {
        // TODO: there's probably a smarter way than just subtracting a flat 150 from the chart width
        const chartWidth = select('#charts').node().getBoundingClientRect().width - 150;
        this.setState({
            chartWidth
        });
    }

    componentDidMount() {
        this.adjustChartWidth();
        window.addEventListener('resize', this.adjustChartWidth);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.adjustChartWidth);
    }

    render() {
        let chartElements;
        if(this.props.charts) {
            chartElements = this.props.charts.map((chart, index) => {
                const chartTitle = chart.title === '' ? 'Untitled chart' : chart.title;

                return <Chart key={index} chartID={index} title={chartTitle}
                              width={this.state.chartWidth} height={this.props.height}
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