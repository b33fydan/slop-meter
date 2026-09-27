# Slop Meter

An always-on-top desktop overlay for recording reactions to AI videos. A transparent opening reveals the video in the app underneath; the surrounding desktop is covered by the Slop Meter frame. Nothing is uploaded and there is no AI API or server dependency.

## Run

Requires Node.js/npm and Git. Clone this repository on each computer (do not copy `node_modules` between Mac and Windows):

```sh
git clone https://github.com/b33fydan/slop-meter.git
cd slop-meter
npm ci
npm start
```

On Mac, double-click `Launch Slop Meter.command` after installing dependencies. On Windows, double-click `Launch Slop Meter.cmd`. The first Electron launch may download its platform binary.

1. Put your social-media video in a regular browser window on the recording display.
2. Launch the overlay. Choose **16:9** or **9:16**.
3. The opening starts larger in both formats. Adjust **Size** or choose **Max size** to fill the available space. In portrait, Max size extends nearly the full display height, with branding and controls kept in the left column. Hover any border and drag it to resize that edge independently; alignment mode is not required. Corners keep the current proportions. **Size** and **Max size** preserve your custom shape, and clicking **16:9** or **9:16** restores that preset. Use **Align video** to drag the whole opening. Move or resize the browser underneath as needed. Turn alignment off to interact with the video through the opening.
4. Drag the right-hand meter yourself, or use the rating shortcuts. Each increase shortcut counts one flaw and adds 10 slop points. The slider changes the rating without changing the flaw count. Moving it upward plays the vine boom: once per upward drag, again if you reverse down then up, and on each keyboard/button increase. Downward moves are quiet.
5. At 100, the fart sound plays once, the oversized, indifferent poop mascot goes wild, and mud globs and droplets erupt across the screen, splatting and dripping. The bundled fart clip has a 10 dB FFmpeg gain boost with a limiter to avoid clipping. Lower the meter to stop the continuous spray; the existing particles fade out. Reset clears the mud and confetti immediately and stops any sound.
6. **HUMAN TASTE** rains confetti from the top of the screen and plays the anime wow sound. **SUS 🤔** plays the cricket sound. Both buttons stay beside the meter and do not change the rating. **Clean mode** hides the setup controls for recording; the reaction buttons remain available. Use the shortcut to restore them.
7. Record the **whole display** in OBS or your screen recorder so both the underlying video and overlay appear. Capturing only the browser window will not include this overlay.

## Global shortcuts

Use **Command + Option** on Mac, or **Ctrl + Alt** on Windows:

| Key | Action |
| --- | --- |
| Up / Down | Add / remove one flaw and 10 rating points |
| R | Reset score, flaws, and particles |
| H | Hide / restore controls |
| A | Toggle opening alignment |
| E | Fire a one-off mud eruption |
| Q | Quit overlay |

The close button is also available when controls are visible. A banner reports unavailable global shortcuts. **Next display** moves the overlay between connected displays. The four sound clips are bundled in `assets/sounds/` so they work on both Windows and Mac. Each new reaction restarts its sound and stops the previous reaction. The rating boom uses a separate channel, so the boom and fart can both play when the score reaches 100. Enable desktop/app audio capture in your recorder to include them.

## Personal Windows app

To build a portable Windows x64 executable from this checkout, run:

```sh
npm ci
npm run package:win
```

Open `dist/Slop-Meter-0.2.0-Windows.exe` to launch the app. The executable includes Electron, the custom mascot, and all four sounds, so it needs no Node.js installation or separate audio files. It runs under your Windows account without an installer or administrator access. The build command creates local files only; it does not publish a release.

## Implementation and verification

Electron's transparent BrowserWindow provides the native overlay and always-on-top behavior. The main process polls cursor position at 25 Hz to pass clicks through the video opening, except during alignment, a border hover, or an active drag. The renderer uses an SVG mask for the opening and bounded canvas particles for the eruption. It does not embed or intercept social platforms.

`npm test` runs the focused native smoke check with an isolated profile and saves screenshots in `output/`. It checks rating, mud splats, reset, aspect ratio, clean mode, all four resize corners, independent edge resizing, native click-through during hover and dragging, opening bounds, maximum size on a 720p desktop, confetti, and sound playback. Test audio is muted. Run on a desktop session; it briefly opens a test overlay. Windows behavior and final screen-recorder output still need a device-specific check. Browser preview alone does not provide native transparency or always-on-top behavior.

Reference: https://www.electronjs.org/docs/latest/api/browser-window

## Future development

This is a standalone application. `main.cjs` owns the desktop window and shortcuts; `preload.cjs` exposes the narrow desktop bridge; `renderer.js`, `style.css`, and `index.html` own the interface and mud effect. After saving local changes, use `git pull` and `npm ci` to update another machine.
