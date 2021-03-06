import React, {Component} from 'react';
import * as d3 from 'd3';
import * as math from 'mathjs';
import * as _ from 'lodash';
import {withFauxDOM} from 'react-faux-dom';

import {parseVariable} from '../dist/parse_variable';
import variableColors from '../colors';

/**
 * Properties:
 *
 * chartID
 * width
 * height
 * variables
 * minX
 * maxX
 * minY
 * maxY
 */
class Chart extends Component {
    constructor(props) {
        super(props);
        this.ID = this.props.chartID;
        this.faux = this.props.connectFauxDOM('div', `chart${this.ID}`);

        const width = this.props.width,
            height = this.props.height;
        const margin = {
            left: width / 20,
            right: width / 20,
            top: height / 20,
            bottom: height / 20
        };

        const svg = d3.select(this.faux).append('svg')
            .attr("id", `chart${this.ID}`)
            .attr("width", this.props.width + margin.left + margin.right)
            .attr("height", this.props.height + margin.top + margin.bottom);

        this.svg = svg;
        this.margin = margin;

        const tip = d3.select('body').append("div")
            .attr("class", `${this.ID} tooltip`)
            .style("opacity", 0);

        this.tip = tip;
    }

    componentDidUpdate() {
        const minX = this.props.minX,
            maxX = this.props.maxX,
            minY = this.props.minY,
            maxY = this.props.maxY;

        const svg = this.svg;

        this.updateGraph(svg, this.props.width, this.props.height,
            minX, maxX, minY, maxY);
    }

    updateGraph(svg, width, height, minX, maxX, minY, maxY) {
        const faux = this.faux,
            self = this;

        const CHART_ID_CLASS = `chart${this.ID}`;

        // Need to have this as a function and not a variable for some reason
        // I assume it's some issue with react-faux-dom not having full support for D3 4.x or something
        const getRoot = () => d3.select(`svg#${CHART_ID_CLASS} g`);

        d3.select(`svg#${CHART_ID_CLASS}`).selectAll("*").remove(); // clear current chart

        d3.select(`svg#${CHART_ID_CLASS}`).append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        const defs = getRoot().append("defs").attr("class", "test"); // svg defs

        // arrowhead def
        defs.append("marker")
            .attr("id", "arrow-marker")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 5)
            .attr("refY", 0)
            .attr("markerWidth", 4)
            .attr("markerHeight", 4)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0, -5L10, 0L0, 5")
            .attr("class", "arrow-head");

        function variableIsDiscrete(variable) {
            // TODO: rewrite the entire distributions spec to make all variables extend a superclass
            if (typeof variable === 'string') {
                // PDF variable
                return false;
            } else {
                return variable.isDiscrete;
            }
        }

        function normalPDF(mean, variance) {
            return "1/(" + Math.sqrt(variance) + "*sqrt(2*pi)) * exp(-(x-" + mean + ")^2/(2*" + variance + "))";
        }

        function round3DP(num) {
            return Math.round(num * 1000) / 1000;
        }

        function isBetween(n, a, b) {
            return (n < a && n > b) || (n > a && n < b);
        }

        function matrixToPolygonPoints(matrix, xFn, yFn) {
            return matrix.map(function (elem) {
                return [xFn(elem.x), yFn(elem.y)];
            }).join(" ");
        }

        // parse all the variables, and assign them colours
        const discreteVariables = {},
            continuousVariables = {};

        let count = 0,
            discreteVariablesCount = 0,
            continuousVariablesCount = 0;
        _.forOwn(this.props.variables, (value, key) => {
            const variable = parseVariable(value);
            let obj;

            if (variableIsDiscrete(variable)) {
                obj = discreteVariables;
                discreteVariablesCount++;
            } else {
                obj = continuousVariables;
                continuousVariablesCount++;
            }

            obj[key] = {
                variable: parseVariable(value),
                color: count % variableColors.length
            };

            count++;
        });

        // this is the total width allotted to each set of bars
        // if there is one bar, then the entire bar is this wide
        // if there are more than one, then they all share this width (they must fit inside it)
        const setWidthWithSpacing = width / (maxX - minX + 1),
            translationDistance = setWidthWithSpacing / 2;

        // make the x- and y-axes
        const xDomain = [],
            yDomain = [minY, maxY];

        for (let i = minX; i <= maxX; i++) {
            xDomain.push(i);
        }

        const x = d3.scaleLinear()
            .domain([minX, maxX])
            .range([0, width - setWidthWithSpacing]);

        const y = d3.scaleLinear()
            .domain(yDomain)
            .range([height, 0]);

        const xAxis = d3.axisBottom(x)
            .ticks(maxX - minX);

        const yAxis = d3.axisLeft(y);

        // draw the x axis
        getRoot().append("g")
            .attr("class", `${CHART_ID_CLASS} x axis`)
            .attr("transform", `translate(${translationDistance}, ${y(0)})`)
            .call(xAxis);

        // draw the y axis
        getRoot().append("g")
            .attr("class", `${CHART_ID_CLASS} y axis`)
            .attr("transform", "translate(" + x(0) + ", 0)")
            .call(yAxis);

        // for some reason I can't directly append to the y-axis
        // again, most likely some issue with react-faux-dom
        getRoot().append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .attr("class", `${CHART_ID_CLASS} y-axis-label`)
            .text("Probability/density");

        // make bar chart rectangles
        // only do this if we have discrete variables:
        if (discreteVariablesCount > 0) {
            // tooltip div
            // I don't really want to append directly to body but it only works this way if I do
            const tip = this.tip;

            const minOrZero = minX < 0 ? 0 : minX;

            const setSpacing = setWidthWithSpacing / 10, // spacing between sets
                setWidth = setWidthWithSpacing - 2 * setSpacing, // actual set width (minus spacing)
                barSpacing = setWidth / 20, // spacing between bars
                barWidth = (setWidth - (barSpacing * (discreteVariablesCount - 1))) / discreteVariablesCount; // width of one bar

            // for each discrete var, make a set of bars
            let count = 0;
            _.forOwn(discreteVariables, (value, variableName) => {
                const variable = value.variable;

                const barColor = variableColors[value.color],
                    xShift = (barWidth + barSpacing) * count;

                const barClassName = `${CHART_ID_CLASS} bar i${count}`,
                    barSelector = `.${CHART_ID_CLASS}.bar.i${count}`,
                    barId = ({variableIndex, index}) => `${CHART_ID_CLASS}bar${index}i${variableIndex}`;

                /*
                 * Bars need to have IDs, this is because react-faux-dom is weird with `this` in event listeners, which
                 * means I can't use it to select the current element in a listener. Instead I can create a function
                 * that generates IDs, and bind an ID to each bar. Then in the listener, I generate the ID again, and
                 * use it in my selector to select the current bar.
                 */

                function getBar(data) {
                    const selector = `#${barId(data)}`;
                    return d3.select(selector);
                }

                function renderTailArrows(show, coordinates, setWidth, d) {
                    if (show) {
                        // make all arrows visible
                        const aboveBarBy = height / 20;

                        const leftOpenTailValue = round3DP(variable.lessThan(d.value)),
                            rightOpenTailValue = round3DP(variable.greaterThan(d.value));

                        function positionArrowAndLabel(arrow, label, x, y, labelText) {
                            arrow.attr("x1", x)
                                .attr("y1", y)
                                .attr("y2", y);

                            const arrowX2 = +arrow.attr("x2"); // convert to number

                            label.attr("x", (x + arrowX2) / 2)
                                .attr("y", y - 10)
                                .text(labelText);
                        }

                        d3.selectAll(`.${CHART_ID_CLASS}.tail-arrow`)
                            .style("opacity", 1);

                        d3.selectAll(`.${CHART_ID_CLASS}.arrow-label`)
                            .style("opacity", 1);

                        // left open arrow
                        positionArrowAndLabel(
                            d3.select(`.${CHART_ID_CLASS}.left-tail-arrow.open-tail-arrow`),
                            d3.select(`.${CHART_ID_CLASS}.left-open-tail-arrow-label`),
                            coordinates.x,
                            coordinates.y - aboveBarBy,
                            leftOpenTailValue
                        );

                        // right open arrow
                        positionArrowAndLabel(
                            d3.select(`.${CHART_ID_CLASS}.right-tail-arrow.open-tail-arrow`),
                            d3.select(`.${CHART_ID_CLASS}.right-open-tail-arrow-label`),
                            coordinates.x + setWidth,
                            coordinates.y - aboveBarBy,
                            rightOpenTailValue
                        );
                    } else {
                        // make all arrows invisible
                        d3.selectAll(`.${CHART_ID_CLASS}.tail-arrow`)
                            .style("opacity", 0);

                        d3.selectAll(`.${CHART_ID_CLASS}.arrow-label`)
                            .style("opacity", 0);
                    }
                }

                function getActualBarCoordinates(bar) {
                    return {
                        x: +bar.attr("x"),
                        y: +bar.attr("y")
                    };
                }

                const handleMouseOver = (d, i) => {
                    // move the tooltip to where the cursor is and make it visible
                    tip.html(`P(${variableName} = ${d.value}) = ${round3DP(d.frequency)}`)
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
                    tip.transition()
                        .duration(200)
                        .style("opacity", .9);

                    // change the colour to the hover colour
                    const bar = getBar(d);
                    bar.style("fill", barColor.hover);

                    // show tail arrows
                    const setCoordinates = getActualBarCoordinates(bar);
                    renderTailArrows(true, setCoordinates, setWidth, d);
                };
                const handleMouseOut = (d, i) => {
                    // hide the tooltip
                    tip.transition()
                        .duration(500)
                        .style("opacity", 0);

                    // change the colour back to the default colour
                    getBar(d).style("fill", barColor.default);

                    // hide tail arrows
                    renderTailArrows(false);
                };

                const rawDiscreteData = variable.toArray(minOrZero, maxX),
                    discreteData = [];
                for (let i = 0; i < rawDiscreteData.length; i++) {
                    const curr = rawDiscreteData[i];
                    if (typeof curr !== "undefined") {
                        discreteData.push({"variableIndex": count, "index": i, "value": i, "frequency": curr});
                    }
                }

                const sigma = Math.sqrt(variable.variance),
                    mu = variable.exp,
                    normalApprox = normalPDF(mu, sigma * sigma);

                getRoot().selectAll(barSelector)
                    .data(discreteData)
                    .enter().append("rect")
                    .style("fill", barColor.default)
                    .attr("class", barClassName)
                    .attr("id", barId)
                    .attr("x", function (d) {
                        return x(d.value) - setWidth / 2 + translationDistance;
                    })
                    .attr("width", barWidth)
                    .attr("transform", `translate(${xShift}, 0)`)
                    // .attr("y", function (d) {
                    //     return y(0);
                    // })
                    // .attr("height", 0)
                    // .transition()
                    // .duration(500)
                    .attr("y", function (d) {
                        return y(d.frequency);
                    })
                    .attr("height", function (d) {
                        return height - y(d.frequency);
                    });


                // bar hover event handers
                getRoot().selectAll(barSelector)
                    .on("mouseover", handleMouseOver)
                    .on("mouseout", handleMouseOut);

                count++;
            });
        }

        if (continuousVariablesCount > 0) {
            // we have continuous variables defined
            const drawContinuousVariablePDFs = (variables, xDomain, x, y, tails, tailsZ, tailsY) => {
                getRoot().selectAll(".graph-line").remove(); // remove the current lines

                // line function
                const line = d3.line()
                    .x(function (d) {
                        return x(d.x);
                    })
                    .y(function (d) {
                        return y(d.y);
                    })
                    .curve(d3.curveBasis);

                const xArray = d3.range((+xDomain[0]), (+xDomain[xDomain.length - 1] + 0.5), 0.1),
                    animationLength = 500;
                _.forOwn(variables, (value, variableName) => {
                    // determine the pdf function for the variable
                    let pdf;
                    if (typeof value.variable === "string") {
                        // the variable is already a pdf
                        pdf = value.variable;
                    } else {
                        // we need to extract the pdf
                        pdf = value.variable.pdfFormula;
                    }
                    const pdfFunction = x => math.eval(pdf, {x}),
                        color = variableColors[value.color]; // the colour to draw the line with

                    // create the data series for the variable (the cartesian co-ordinates for the line)
                    const data = xArray.map(x => {
                        return {
                            x: x,
                            // evaluate y for the given x
                            y: pdfFunction(x)
                        };
                    });

                    // use the data series to draw the path
                    getRoot().append("path")
                        .datum(data)
                        .attr("class", "graph-line")
                        .attr("class", "line")
                        .attr("transform", `translate(${translationDistance}, 0)`) // need to translate the path right since the x-axis is shifted
                        .style("stroke", color.default)
                        .attr("d", line);
                });

                // function tweenDash() {
                //     const l = this.getTotalLength(),
                //         i = d3.interpolateString("0," + l, l + "," + l);
                //     return function (t) {
                //         return i(t);
                //     };
                // }
                //
                // function transition(path) {
                //     path.transition()
                //         .duration(animationLength)
                //         .attrTween("stroke-dasharray", tweenDash);
                // }

                // // put in tails
                // const rightTailPolygon = [],
                //     leftTailPolygon = [];
                // data[0].forEach(elem => {
                //     if (elem.x <= tailsZ[0]) {
                //         leftTailPolygon.push(elem);
                //     } else if (elem.x >= tailsZ[1]) {
                //         rightTailPolygon.push(elem);
                //     } else {
                //         return false;
                //     }
                // });
                // leftTailPolygon.push({x: tailsZ[0], y: tailsY[0]}, {x: tailsZ[0], y: 0}, {x: 0, y: 0});
                // rightTailPolygon.unshift({x: 0, y: 0}, {x: tailsZ[1], y: 0}, {x: tailsZ[1], y: tailsY[1]}); // it hurts my eyes
                //
                // setTimeout(() => {
                //     if (isBetween(tails[0], 0, 1) && isBetween(tailsZ[0], minX, maxX)) {
                //         svg.append("polygon")
                //             .attr({
                //                 points: matrixToPolygonPoints(leftTailPolygon, x, y),
                //                 id: "leftTail",
                //                 "class": "tail"
                //             });
                //     }
                //     if (isBetween(tails[1], 0, 1) && isBetween(tailsZ[1], minX, maxX)) {
                //         svg.append("polygon")
                //             .attr({
                //                 points: matrixToPolygonPoints(rightTailPolygon, x, y),
                //                 id: "rightTail",
                //                 "class": "tail"
                //             });
                //     }
                //     svg.selectAll(".tail")
                //         .style({
                //             opacity: 0.5,
                //             fill: "red"
                //         })
                //         .on("mouseover", function () {
                //             const self = d3.select(this),
                //                 side = self.attr("id").slice(0, -4),
                //                 popupId = self.attr("id") + "Popup";
                //
                //             self.style("opacity", 0.7);
                //             // TODO: write code for popup showing the tail's z-value
                //             // svg.append (TBC)
                //         })
                //         .on("mouseout", function () {
                //             const self = d3.select(this),
                //                 side = self.attr("id").slice(0, -4),
                //                 popupId = self.attr("id") + "Popup";
                //
                //             self.style("opacity", 0.5);
                //             d3.selectAll(".tailPopup") // for the future
                //                 .remove();
                //         });
                // }, animationLength);
            };

            // now we plot the PDFs
            drawContinuousVariablePDFs(continuousVariables, xDomain, x, y);
        }

        if (discreteVariablesCount > 0) {
            // tail arrows, must be drawn after the bars AND continuous variable lines to render on top of them

            // left open arrow and label
            getRoot().append('line')
                .attr("class", `${CHART_ID_CLASS} tail-arrow left-tail-arrow open-tail-arrow`)
                .attr("x2", translationDistance);
            getRoot().append('text')
                .attr("class", `${CHART_ID_CLASS} arrow-label left-open-tail-arrow-label`);

            // right open arrow and label
            getRoot().append('line')
                .attr("class", `${CHART_ID_CLASS} tail-arrow right-tail-arrow open-tail-arrow`)
                .attr("x2", x(maxX) + translationDistance);
            getRoot().append('text')
                .attr("class", `${CHART_ID_CLASS} arrow-label right-open-tail-arrow-label`);

            getRoot().selectAll(".tail-arrow")
                .attr("marker-end", "url(#arrow-marker)")
                .style("opacity", 0);

            getRoot().selectAll(".arrow-label")
                .style("opacity", 0)
                .attr("text-anchor", "middle");
        }

        // add title to graph
        // must be done last to render above everything
        getRoot().append("text")
            .attr("class", `${CHART_ID_CLASS} chart-title`)
            .attr("x", (width / 2))
            .attr("y", height / 20)
            .attr("text-anchor", "middle")
            .text(this.props.title.toUpperCase());

        return true;
    };

    render() {
        return (
            <div className="chart-container">
                {this.props[`chart${this.ID}`]}
            </div>
        );
    }
}

Chart.defaultProps = {
    chart: 'loading...',
    title: 'Untitled chart',
    minX: 0,
    maxX: 10,
    minY: 0,
    maxY: 1
};

export default withFauxDOM(Chart);
