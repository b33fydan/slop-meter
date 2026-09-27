# Slop Meter

A silent, always-on-top desktop overlay for recording reactions to AI videos. A transparent opening reveals the video in the app underneath; the surrounding desktop is covered by the Slop Meter frame. Nothing is uploaded and there is no AI API or server dependency.

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
3. Use **Align video**, drag the opening, and adjust **Size**. Move or resize the browser underneath as needed. Turn alignment off to interact with the video through the opening.
4. Drag the right-hand meter yourself, or use the rating shortcuts. Each increase shortcut counts one flaw and adds 10 slop points. The slider changes the rating without changing the flaw count.
5. At 100, the emoji goes wild and mud globs and droplets erupt across the screen, splatting and dripping. Lower the meter to stop the continuous spray; the existing particles fade out. Reset clears them immediately.
6. **Clean mode** hides the setup controls for recording. Use the shortcut to restore them.
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

The close button is also available when controls are visible. A banner reports unavailable global shortcuts. **Next display** moves the overlay between connected displays. The overlay is silent; audio remains the responsibility of the video and recorder.

## Implementation and verification

Electron's transparent BrowserWindow provides the native overlay and always-on-top behavior. The main process polls cursor position at 25 Hz to pass clicks through the video opening, except during alignment. The renderer uses an SVG mask for the opening and bounded canvas particles for the eruption. It does not embed or intercept social platforms.

`npm test` runs the focused native smoke check with an isolated profile and saves screenshots in `output/`. It checks rating, mud splats, reset, aspect ratio, and clean mode. Run on a desktop session; it briefly opens a test overlay. Windows behavior and final screen-recorder output still need a device-specific check. Browser preview alone does not provide native transparency or always-on-top behavior.

Reference: https://www.electronjs.org/docs/latest/api/browser-window

## Future development

This is a standalone application. `main.cjs` owns the desktop window and shortcuts; `preload.cjs` exposes the narrow desktop bridge; `renderer.js`, `style.css`, and `index.html` own the interface and mud effect. After saving local changes, use `git pull` and `npm ci` to update another machine.
