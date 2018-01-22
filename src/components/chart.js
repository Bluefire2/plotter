import React, {Component} from 'react';
import * as d3 from 'd3';
import * as math from 'mathjs';
import * as _ from 'lodash';
import {withFauxDOM} from 'react-faux-dom';
import {Normal, Poisson, Binomial, NBinomial, Geometric} from '../distributions';

/**
 * Properties:
 *
 * width
 * height
 * variables
 * minX
 * maxX
 * minY
 * maxY
 * lt
 * rt
 */
class Chart extends Component {
    constructor(props) {
        super(props);
        this.renderD3 = this.renderD3.bind(this);
        this.faux = this.props.connectFauxDOM('div', 'chart');
    }

    componentDidMount() {
        const width = this.props.width,
            height = this.props.height;

        const margin = {
            left: width / 20,
            right: width / 20,
            top: height / 20,
            bottom: height / 20
        };
        this.renderD3(margin, width, height);
    }

    updateGraph(svg, width, height, minX, maxX, minY, maxY, lt = 0, rt = 1) {
        const self = this;
        // function type(d) {
        //     d.frequency = +d.frequency;
        //     return d;
        // }

        function parseVariable(text) {
            const ref = {
                "N": Normal,
                "Po": Poisson,
                "B": Binomial,
                "NB": NBinomial,
                "Geo": Geometric
            };
            let params, distribution;

            try {
                params = text.split("(")[1].split(")")[0].split(",").map(function (elem) {
                    return parseFloat(elem);
                }); // with readability in mind :)
                distribution = text.split("(")[0];
            } catch (e) {
                // not a standard distribution
                // assume it's a PDF
                return text;
            }
            params.unshift(null);
            return typeof ref[distribution] === "undefined" ? false : (new (Function.prototype.bind.apply(ref[distribution], params)));
        }

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

        // both of these are inclusive summations, so be careful:
        function sumRight(array, loc, fn) {
            fn = typeof fn === "undefined" ? function (a) {
                return a;
            } : fn;
            let out = 0;
            array.slice(loc).forEach(function (elem, index) {
                out += fn(elem);
            });
            return out;
        }

        function sumLeft(array, loc, fn) {
            fn = typeof fn === "undefined" ? function (a) {
                return a;
            } : fn;
            let out = 0;
            array.slice(0, loc + 1).forEach(function (elem, index) {
                out += fn(elem);
            });
            return out;
        }

        function isBetween(n, a, b) {
            return (n < a && n > b) || (n > a && n < b);
        }

        function matrixToPolygonPoints(matrix, xFn, yFn) {
            return matrix.map(function (elem) {
                return [xFn(elem.x), yFn(elem.y)];
            }).join(" ");
        }

        const discreteVar = parseVariable(this.props.discreteVar),
            contVar = parseVariable(this.props.contVar),
            PDF = this.props.pdfVar;

        // parse all the variables, and assign them colours

        const colors = [
            {
                default: 'orange',
                hover: 'orangered'
            },
            {
                default: 'green',
                hover: 'lightgreen'
            },
            {
                default: 'blue',
                hover: 'lightblue'
            }
        ];
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
                color: count % colors.length
            };

            count++;
        });

        const faux = this.faux,
            fnColors = { // probably don't even need this lol
                "contVar": "red",
                "PDF": "green",
                "CDF": "purple"
            };

        let tails, tailsZ, tailsY;
        if (contVar) {
            tails = [lt, rt];
            tailsZ = tails.map(elem => {
                return contVar.CDFinv(elem);
            });
            tailsY = tailsZ.map(elem => {
                return contVar.PDF(elem);
            });
        }

        // make the x- and y-axes
        const xDomain = [minX, maxX],
            yDomain = [minY, maxY];

        const x = d3.scaleLinear()
            .range([0, width]);

        const y = d3.scaleLinear()
            .range([height, 0]);

        const xAxis = d3.axisBottom(x)
            .ticks(maxX - minX);

        const yAxis = d3.axisLeft(y);

        // define x and y
        x.domain(xDomain);
        y.domain(yDomain);

        // line function, for continuous variables
        const line = d3.line()
            .x(function (d) {
                return x(d.x);
            })
            .y(function (d) {
                return y(d.y);
            })
            .curve(d3.curveBasis);

        svg.selectAll("*").remove(); // clear current chart


        // draw the x axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0, " + y(0) + ")")
            .call(xAxis);

        // draw the y axis
        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + x(0) + ", 0)")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Probability/density");

        // make bar chart rectangles
        // only do this if we have discrete variables:
        if (discreteVariablesCount > 0) {
            // tooltip div
            // I don't really want to append directly to body but it only works this way if I do
            const tip = d3.select('body').append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

            const minOrZero = minX < 0 ? 0 : minX;

            // this is the total width alotted to each datum
            // if there is one bar, then the entire bar is this wide
            // if there are more than one, then they all share this width (they must fit inside it)
            const totalBarWidth = (width / (maxX - minX)) / 1.25,
                barSpacing = totalBarWidth / 20, // for now
                singleBarWidth = (totalBarWidth - (barSpacing * (discreteVariablesCount - 1))) / discreteVariablesCount;

            // for each discrete var, make a set of bars
            let count = 0;
            _.forOwn(discreteVariables, (value, variableName) => {
                const variable = value.variable;

                const barColor = colors[value.color],
                    translationXDistance = (singleBarWidth + barSpacing) * count;

                const barClassName = `bar i${count}`,
                    barSelector = `.bar.i${count}`,
                    barId = ({variableIndex, index}) => `bar${variableIndex}i${index}`;

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

                const handleMouseOver = (d, i) => {
                    // move the tooltip to where the cursor is and make it visible
                    tip.html(`P(${variableName} = ${d.value}) = ${round3DP(d.frequency)}`)
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
                    tip.transition()
                        .duration(200)
                        .style("opacity", .9);

                    // change the colour to the hover colour
                    getBar(d).style("fill", barColor.hover);
                };
                const handleMouseOut = (d, i) => {
                    // hide the tooltip
                    tip.transition()
                        .duration(500)
                        .style("opacity", 0);

                    // change the colour back to the default colour
                    getBar(d).style("fill", barColor.default);
                };

                const rawDiscreteData = variable.toArray(minOrZero, maxX),
                    discreteData = [];
                for (let i = 0; i < rawDiscreteData.length; i++) {
                    const curr = rawDiscreteData[i];
                    if (typeof curr !== "undefined") {
                        discreteData.push({"variableIndex": count, "index": i, "value": i, "frequency": curr});
                    }
                }

                const sigma = Math.sqrt(variable.Var()),
                    mu = variable.E(),
                    normalApprox = normalPDF(mu, sigma * sigma);

                svg.selectAll(barSelector)
                    .data(discreteData)
                    .enter().append("rect")
                    .style("fill", barColor.default)
                    .attr("class", barClassName)
                    .attr("id", barId)
                    .attr("x", function (d) {
                        return x(d.value) - totalBarWidth / 2;
                    })
                    .attr("width", singleBarWidth)
                    .attr("transform", `translate(${translationXDistance}, 0)`)
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

                svg.selectAll(barSelector)
                    .on("mouseover", handleMouseOver)
                    .on("mouseout", handleMouseOut);

                // make the first bar half as wide to accommodate the y-axis
                // svg.select(".bar")
                //     .attr("width", singleBarWidth / 2)
                //     .attr("transform", "translate(" + singleBarWidth / 2 + ", 0)");
                count++;
            });
        }

        const makeLineFunction = (line, formulae, colors, xDomain, x, y, tails, tailsZ, tailsY) => {
            d3.select(faux).selectAll(".graph-line").remove(); // remove the current line
            const xArray = d3.range(xDomain[0], xDomain[1] + 0.5, 0.1),
                data = [],
                animationLength = 3000;
            formulae.forEach(function (elem, index) {
                data[index] = xArray.map((x1) => {
                    return {
                        x: x1,
                        // evaluate y for the given x
                        y: math.eval(elem, {
                            x: x1
                        })
                    };
                });
            });

            function tweenDash() {
                // too lazy to figure this out properly ngl
                console.log(this);
                const l = this.getTotalLength(),
                    i = d3.interpolateString("0," + l, l + "," + l);
                return function (t) {
                    return i(t);
                };
            }

            const transition = (path) => {
                path.transition()
                    .duration(animationLength)
                    .attrTween("stroke-dasharray", tweenDash);
            };

            // make the path
            data.forEach((elem, index) => {
                svg.append("path")
                    .datum(elem)
                    .attr("class", "graph-line")
                    .style("color", colors[index])
                    .attr("d", line)
                    .call(transition);
            });

            // put in tails
            const rightTailPolygon = [],
                leftTailPolygon = [];
            data[0].forEach(elem => {
                if (elem.x <= tailsZ[0]) {
                    leftTailPolygon.push(elem);
                } else if (elem.x >= tailsZ[1]) {
                    rightTailPolygon.push(elem);
                } else {
                    return false;
                }
            });
            leftTailPolygon.push({x: tailsZ[0], y: tailsY[0]}, {x: tailsZ[0], y: 0}, {x: 0, y: 0});
            rightTailPolygon.unshift({x: 0, y: 0}, {x: tailsZ[1], y: 0}, {x: tailsZ[1], y: tailsY[1]}); // it hurts my eyes

            setTimeout(() => {
                if (isBetween(tails[0], 0, 1) && isBetween(tailsZ[0], minX, maxX)) {
                    svg.append("polygon")
                        .attr({
                            points: matrixToPolygonPoints(leftTailPolygon, x, y),
                            id: "leftTail",
                            "class": "tail"
                        });
                }
                if (isBetween(tails[1], 0, 1) && isBetween(tailsZ[1], minX, maxX)) {
                    svg.append("polygon")
                        .attr({
                            points: matrixToPolygonPoints(rightTailPolygon, x, y),
                            id: "rightTail",
                            "class": "tail"
                        });
                }
                svg.selectAll(".tail")
                    .style({
                        opacity: 0.5,
                        fill: "red"
                    })
                    .on("mouseover", function () {
                        const self = d3.select(this),
                            side = self.attr("id").slice(0, -4),
                            popupId = self.attr("id") + "Popup";

                        self.style("opacity", 0.7);
                        // TODO: write code for popup showing the tail's z-value
                        // svg.append (TBC)
                    })
                    .on("mouseout", function () {
                        const self = d3.select(this),
                            side = self.attr("id").slice(0, -4),
                            popupId = self.attr("id") + "Popup";

                        self.style("opacity", 0.5);
                        d3.selectAll(".tailPopup") // for the future
                            .remove();
                    });
            }, animationLength);
        };

        const PDFs = [],
            lineColors = [];
        let flag = false;
        if (contVar) {
            flag = true;
            PDFs.push(normalPDF(contVar.E(), contVar.Var()));
            lineColors.push(fnColors.contVar);
        }
        if (PDF) {
            flag = true;
            PDFs.push(PDF);
            lineColors.push(fnColors.PDF);
        }
        if (flag) {
            makeLineFunction(line, PDFs, lineColors, xDomain, x, y, tails, tailsZ, tailsY);
        }

        return true;
    };

    renderD3(margin, width, height) {
        const faux = this.faux; // the faux-dom container

        const svg = d3.select(faux).append('svg')
            .attr("id", "graph")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        this.svg = svg;

        // plot the graph
        const minX = this.props.minX,
            maxX = this.props.maxX,
            minY = this.props.minY,
            maxY = this.props.maxY;

        this.updateGraph(svg, this.props.width, this.props.height,
            minX, maxX, minY, maxY,
            this.props.lt, this.props.rt);
    }

    render() {
        return (
            <div id="graph-container">
                {this.props.chart}
            </div>
        );
    }
}

Chart.defaultProps = {
    chart: 'loading...',
    minX: 0,
    maxX: 20,
    minY: 0,
    maxY: 1,
    lt: 0,
    rt: 1
};

export default withFauxDOM(Chart);
