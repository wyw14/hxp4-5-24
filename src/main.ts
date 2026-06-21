import './style.css'
import { OrigamiGame } from './game/OrigamiGame'

const app = document.querySelector<HTMLDivElement>('#app')!

new OrigamiGame(app)
