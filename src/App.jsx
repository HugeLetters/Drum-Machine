import { Background, DrumMachine } from './Components'
import React from 'react';

export class App extends React.Component {
  render() {
    return <>
      <Background />
      <DrumMachine />
    </>
  }
}
export default App;