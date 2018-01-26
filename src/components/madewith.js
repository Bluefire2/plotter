import React, {Component} from 'react';

class MadeWith extends Component {
    render() {
        return (
            <div id="made-with">
                {this.props.logos.map((logo, index) => {
                    return (
                        <a key={index} href={logo.href}>
                            <img src={logo.image} alt="" className="made-with-logo"/>
                        </a>
                    );
                })}
            </div>
        );
    }
}

export default MadeWith;
