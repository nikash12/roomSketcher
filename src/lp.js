import React from 'react';
import './lp.css'; // Import the CSS file

const Lp = () => {
    return (
        <div className="container">
            {/* Header with Logo and Sign In/Log Out */}
            <div className="header">
                <div className="logo">roomSkechers</div>
                <div className="sign-in">Sign In / Log Out</div>
            </div>

            {/* Continuous marquee */}
            <div className="marquee-container">
                <div className="marquee-text">
                    Build Your Dream Home Using AI!
                </div>
            </div>

            {/* 3D Cubes */}
            <div className="cube-container">
                {[...Array(3)].map((_, index) => (
                    <div className="cube" key={index} style={{ animationDelay: `${index * 1.67}s` }}>
                        <div className="face front"></div>
                        <div className="face back"></div>
                        <div className="face left"></div>
                        <div className="face right"></div>
                        <div className="face top"></div>
                        <div className="face bottom"></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Lp;
