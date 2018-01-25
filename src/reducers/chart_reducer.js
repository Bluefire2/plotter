export default (state = null, action) => {
    switch (action.type) {
        case 'ADD_CHART':
            const s = JSON.parse(JSON.stringify(state));
            s.unshift(action.payload); // prepend to array since we want this new chart to be on top
            return s;
        default:
            return state;
    }
}