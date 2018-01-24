export default (state = null, action) => {
    switch (action.type) {
        case 'CHANGE_WIDTH':
            return action.payload;
        default:
            return state;
    }
}