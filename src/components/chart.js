import React, {Component} from 'react';
import * as d3 from 'd3';
import * as math from 'mathjs';
import {withFauxDOM} from 'react-faux-dom';
import {Normal, Poisson, Binomial, NBinomial, Geometric} from '../distributions';


/**
 * Properties:
 *
 * width
 * height
 * discreteVar
 * contVar
 * pdfVar
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
                // oops
                return false;
            }
            params.unshift(null);
            return typeof ref[distribution] === "undefined" ? false : (new (Function.prototype.bind.apply(ref[distribution], params)));
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
        // TODO: make this return a promise that resolves when the graph is finished
        const discreteVar = parseVariable(this.props.discreteVar),
            contVar = parseVariable(this.props.contVar),
            PDF = this.props.pdfVar;

        const faux = this.faux,
            fnColors = { // probably don't even need this lol
                "contVar": "red",
                "PDF": "green",
                "CDF": "purple"
            };

        let tails,
            tailsZ,
            tailsY;
        if (contVar) {
            tails = [lt, rt];
            tailsZ = tails.map(elem => {
                return contVar.CDFinv(elem);
            });
            tailsY = tailsZ.map(elem => {
                return contVar.PDF(elem);
            });
        }

        const xDomain = [minX, maxX],
            yDomain = [minY, maxY];

        const x = d3.scaleLinear()
            .range([0, width]);

        const y = d3.scaleLinear()
            .range([height, 0]);

        const xAxis = d3.axisBottom(x)
            .ticks(maxX - minX);

        const yAxis = d3.axisLeft(y);
        //define x and y
        x.domain(xDomain);
        y.domain(yDomain);

        //line function
        const line = d3.line()
            .x(function (d) {
                return x(d.x);
            })
            .y(function (d) {
                return y(d.y);
            })
            .curve(d3.curveBasis);

        svg.selectAll("*").remove(); // clear current chart


        //make x axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0, " + y(0) + ")")
            .call(xAxis);
        //make y axis
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

        /* critical region testing stuff
        svg.append("text")
            .attr("x", x(5.75))
            .attr("y", y(0))
            .attr("dy", ".71em")
            .attr("text-anchor", "middle")
            .text("5.75");
        */
        
        //make bar chart rectangle
        if (discreteVar) {
            // let mouseOutTimeout,
            //     currI,
            //     boxUp = false;
            const handleMouseOver = (d, i) => {
                // if (currI !== i || !boxUp) { // generate a box if either there is no box or there is one but it's over a different bar
                //     console.log('generating box');
                //     svg.selectAll(".popupRect")
                //         .remove();
                //
                //     clearTimeout(mouseOutTimeout); // just in case
                //
                //     currI = i;
                //
                //     const currX = i === 0 ? x(0) + barWidth / 2 : x(d.value),
                //         currY = y(d.frequency),
                //         fsize = 60,
                //         boxWidth = 400,
                //         boxHeight = 100,
                //         boxX = currX - boxWidth / 2,
                //         boxY = currY - (boxHeight + 30),
                //         aRectWidth = boxWidth / 20; // for now
                //
                //     // callout rectangle
                //     console.log(svg)
                //     svg.select('g').append("rect")
                //         .attr({
                //             x: boxX,
                //             y: boxY, // for now
                //             fill: "lightblue",
                //             width: boxWidth,
                //             height: boxHeight,
                //             id: "popupRectMain",
                //             "class": "popupRect"
                //         });
                //
                //     // callout triangle to complete the shape
                //     svg.append("polygon")
                //         .attr({
                //             points: [[boxX + boxWidth / 2 + 10, boxY + boxHeight - 1], [boxX + boxWidth / 2 - 10, boxY + boxHeight - 1], [boxX + boxWidth / 2, boxY + boxHeight + 15 - 1]].map(function (elem, index) {
                //                 return elem.join(",");
                //             }).join(" "),
                //             fill: "lightblue",
                //             "class": "popupRect"
                //         });
                //
                //     // variable data text
                //     svg.append("text")
                //         .text(function () {
                //             return round3DP(d.frequency);
                //         })
                //         .attr({
                //             x: boxX + boxWidth / 2,
                //             y: boxY + boxHeight / 2,
                //             dy: "0.35em",
                //             id: "popupDataText",
                //             "class": "popupRect",
                //             "font-family": "Arial White",
                //             "font-size": fsize,
                //             "text-anchor": "middle"
                //         });
                //
                //     // callout selection arrows
                //     svg.append("polygon")
                //         .attr({
                //             points: [[boxX + 20, boxY + boxHeight / 2], [boxX + 60, boxY + 20], [boxX + 60, boxY + boxHeight - 20]].map(function (elem, index) {
                //                 return elem.join(",");
                //             }).join(" "),
                //             fill: "steelblue",
                //             id: "leftArrow",
                //             "class": "popupArrow popupRect"
                //         });
                //
                //     svg.append("polygon")
                //         .attr({
                //             points: [[boxX + boxWidth - 20, boxY + boxHeight / 2], [boxX + boxWidth - 60, boxY + 20], [boxX + boxWidth - 60, boxY + boxHeight - 20]].map(function (elem, index) {
                //                 return elem.join(",");
                //             }).join(" "),
                //             fill: "steelblue",
                //             id: "rightArrow",
                //             "class": "popupArrow popupRect"
                //         });
                //
                //     svg.append("rect")
                //         .attr({
                //             width: aRectWidth,
                //             height: boxHeight - 40,
                //             x: boxX + 70,
                //             y: boxY + 20,
                //             fill: "steelblue",
                //             id: "leftArrowIncl",
                //             "class": "popupArrow popupRect"
                //         });
                //
                //     svg.append("rect")
                //         .attr({
                //             width: aRectWidth,
                //             height: boxHeight - 40,
                //             x: boxX + boxWidth - (70 + aRectWidth),
                //             y: boxY + 20,
                //             fill: "steelblue",
                //             id: "rightArrowIncl",
                //             "class": "popupArrow popupRect"
                //         });
                //
                //     svg.selectAll(".popupArrow")
                //         .on("mouseover.arrowHover", function () {
                //             const text = d3.select(faux).select(svg).select("#popupDataText"),
                //                 currText = d.frequency,
                //                 bars = d3.select(faux).select(svg).selectAll(".bar"),
                //                 arrow = d3.select(this),
                //                 incl = arrow.attr("id").indexOf("Incl") !== -1,
                //                 tailDirection = arrow.attr("id").indexOf("rightArrow") !== -1 ? "right" : "left",
                //                 summationFn = tailDirection === "right" ? sumRight : sumLeft;
                //             let startingBarIndex, tail;
                //
                //             arrow.attr("fill", "brown");
                //
                //             if (incl) {
                //                 d3.select(faux).select(svg).select("#" + tailDirection + "Arrow")
                //                     .attr("fill", "brown");
                //             }
                //
                //             if (tailDirection === "right") {
                //                 bars.each(function (datum, index) {
                //                     const elem = d3.select(this);
                //
                //                     startingBarIndex = incl ? i : i + 1;
                //
                //                     if (index < startingBarIndex) {
                //                         elem.classed("tail", false); // just in case
                //                         return false;
                //                     } else {
                //                         elem.classed("tail", true);
                //                     }
                //                 });
                //             } else {
                //                 bars.each(function (datum, index) {
                //                     const elem = d3.select(this);
                //
                //                     startingBarIndex = incl ? i : i - 1;
                //
                //                     if (index > startingBarIndex) {
                //                         elem.classed("tail", false); // just in case
                //                         return false;
                //                     } else {
                //                         elem.classed("tail", true);
                //                     }
                //                 });
                //             }
                //
                //             tail = summationFn(discreteData, startingBarIndex, function (elem) {
                //                 return elem.frequency;
                //             });
                //
                //             text.text(function () {
                //                 return round3DP(tail);
                //             });
                //         })
                //         .on("mouseout.arrowHover", function () {
                //             const text = d3.select(faux).select(svg).select("#popupDataText"),
                //                 arrow = d3.select(faux).select(svg).selectAll(".popupArrow");
                //
                //             arrow.attr("fill", "steelblue");
                //             d3.select(faux).select(svg).selectAll(".bar")
                //                 .classed("tail", false);
                //
                //             text.text(function () {
                //                 return round3DP(d.frequency);
                //             });
                //         });
                //
                //     svg.selectAll(".popupRect")
                //         .on("mouseover.mainHover", function () {
                //             clearTimeout(mouseOutTimeout);
                //             boxUp = true;
                //         })
                //         .on("mouseout.mainHover", function () {
                //                 mouseOutTimeout = setTimeout(function () {
                //                     svg.select(faux).select(svg).selectAll(".popupRect")
                //                         .remove();
                //                     boxUp = false;
                //                 }, 500);
                //         });
                // } else {
                //     clearTimeout(mouseOutTimeout);
                //     boxUp = true;
                // }
            };
            const handleMouseOut = (d, i) => {
                // mouseOutTimeout = setTimeout(function () {
                //     svg.selectAll(".popupRect")
                //         .remove();
                //     boxUp = false;
                // }, 500);
            };

            const minOrZero = minX < 0 ? 0 : minX,
                rawDiscreteData = discreteVar.toArray(minOrZero, maxX),
                discreteData = [];
            for (let i = 0; i < rawDiscreteData.length; i++) {
                const curr = rawDiscreteData[i];
                if (typeof curr !== "undefined") {
                    discreteData.push({"value": i, "frequency": curr});
                }
            }

            const sigma = Math.sqrt(discreteVar.Var()),
                mu = discreteVar.E(),
                normalApprox = normalPDF(mu, sigma * sigma),
                barWidth = (width / (maxX - minX)) / 1.25; // for now

            svg.selectAll(".bar")
                .data(discreteData)
                .enter().append("rect")
                .attr("class", "bar")
                .attr("x", function (d) {
                    return x(d.value) - barWidth / 2;
                })
                .attr("width", barWidth)
                .attr("y", function (d) {
                    return y(0);
                })
                .attr("height", 0)
                .transition()
                .duration(500)
                .attr("y", function (d) {
                    return y(d.frequency);
                })
                .attr("height", function (d) {
                    return height - y(d.frequency);
                });

            // make the first bar half as wide to accomodate the y-axis
            svg.select(".bar")
                .attr("width", barWidth / 2)
                .attr("transform", "translate(" + barWidth / 2 + ", 0)");

            svg.selectAll(".bar")
                .on("mouseover", handleMouseOver)
                .on("mouseout", handleMouseOut);
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
            colors = [];
        let flag = false;
        if (contVar) {
            flag = true;
            PDFs.push(normalPDF(contVar.E(), contVar.Var()));
            colors.push(fnColors.contVar);
        }
        if (PDF) {
            flag = true;
            PDFs.push(PDF);
            colors.push(fnColors.PDF);
        }
        if (flag) {
            makeLineFunction(line, PDFs, colors, xDomain, x, y, tails, tailsZ, tailsY);
        }

        return true;
    };

    renderD3(margin, width, height) {
        const faux = this.faux;
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
