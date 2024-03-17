import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './Home';
import Dashboard from './Dashboard'; // Importa el componente Dashboard


function Routes() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} /> {/* Agrega esta línea para el Dashboard */}

      </Switch>
    </Router>
  );
}

export default Routes;