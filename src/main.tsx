import { render } from 'preact';
import 'maplibre-gl/dist/maplibre-gl.css';
import './styles.css';
import { App } from './App';

render(<App />, document.getElementById('app')!);
