export default (state = null, action) => {
    switch (action.type) {
        case 'ADD_CHART':
            const s = Object.assign({}, state);
            console.log("a", s)
            s.push(action.payload);
            return s;
        default:
            return state;
    }
}