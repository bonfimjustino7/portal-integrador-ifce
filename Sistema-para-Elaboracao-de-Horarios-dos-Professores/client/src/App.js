import './App.css';
import {useState} from "react";
import AppRoutes from "./routes/AppRoutes";

function App() {
    const [isAuthenticated, setAuthenticated] = useState(!!localStorage.getItem('token'));

    return <AppRoutes isAuthenticated={isAuthenticated} setAuthenticated={setAuthenticated}/>;
}

export default App;
