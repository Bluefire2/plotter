export default (state = null, action) => {
    switch (action.type) {
        case 'CHANGE_HEIGHT':
            return action.payload;
        default:
            return state;
    }
}