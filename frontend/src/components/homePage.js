import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";

export default function HomePageDisplay() {
    const navigate = useNavigate();

    async function click(e) {
        e.preventDefault();

        navigate("/mainPage");
    }

    return (
        <div>
            <h2>Test</h2>

            <input
                type="submit"
                value="Submit"
                className="btn btn-primary"
                onClick={click}
            />

        </div>
    )
}