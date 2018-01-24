export function addChart(chart) {
    // addChart is an ActionCreator, so it needs to return an
    // Action, an object with a type property.
    return {
        type: 'ADD_CHART',
        payload: chart
    };
}

export function changeWidth(px) {
    return {
        type: 'CHANGE_WIDTH',
        payload: px
    };
}

export function changeHeight(px) {
    return {
        type: 'CHANGE_HEIGHT',
        payload: px
    };
}