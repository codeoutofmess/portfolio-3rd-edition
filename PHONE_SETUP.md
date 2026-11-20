# Live chess board: phone setup

A small app on your phone, **Chess Relay**, reads the board of your games in the Chess.com app and sends each new position to the website. While you're playing, the home page shows the game on a board, move by move.

What it reads and sends:

- It only reads what's on screen inside the Chess.com app, and only sends the moves.
- Android tells it when you switch apps, so it can tell the website your game has stopped. It doesn't look at the other apps.

The app's code lives in `chess-relay-android/`, next to this site's folder. The ready-to-install file is `ChessRelay.apk`.

You'll need the **password**: the same value you put in `CHESS_STATUS_SECRET` on Vercel.

The website has to be deployed with the live chess feature before the app can talk to it.

---

## 1. Install the app

The app isn't on the Play Store, so Android will ask you to confirm a few times. That's normal for an app you install yourself.

1. Get `ChessRelay.apk` onto your phone. You can open it from the message it was sent in, or from Google Drive or email.
2. Tap the file. If your phone says it can't install apps from this source, tap **Settings**. Turn on **Allow from this source**, then go back.
3. Tap **Install**. If Google Play Protect warns you about an unknown app, tap **More details**, then **Install anyway**.

## 2. Add your password

1. Open **Chess Relay**.
2. Leave the **Website address** as it is (`https://www.pradyumna-design.com/api/chess-status`).
3. Type your password into **Password** and tap **Save**.
4. Tap **Send a test move**. Under "What the website last said" you should see `200 {"ok":true}`. The home page will then show a board with one move (e4) for about 2 minutes.
   - `401` means the password doesn't match the one on Vercel.
   - `404` means the website hasn't been deployed with the chess feature yet.

## 3. Let it read Chess.com

Android 14 blocks this for apps installed outside the Play Store until you allow it. Do these steps in order:

1. Open your phone's **Settings**, then **Apps**, then **Chess Relay**.
2. Tap the **⋮** menu in the top right, then **Allow restricted settings**. Confirm with your fingerprint or PIN.
   (If you don't see it, do step 3 first. The phone will refuse, and then the option appears.)
3. Go back to **Settings**, then **Accessibility**, then **Installed apps**, then **Chess Relay**. Turn it **on** and tap **Allow**.

The Chess Relay app has an **Open Accessibility settings** button that takes you straight there. Its screen says "✓ Reading is on" once it's done.

## 4. Stop the battery saver switching it off

1. Open **Settings**, then **Apps**, then **Chess Relay**, then **Battery**. Choose **Unrestricted**.
2. Open **Settings**, then **Battery**, then **Background usage limits**. Make sure Chess Relay isn't in "Sleeping apps" or "Deep sleeping apps". Add it to **Never sleeping apps**.

---

## Test it with a real game

1. On your computer, open https://www.pradyumna-design.com.
2. Start a game in the Chess.com app and play a few moves.
3. Within a few seconds of each move, the board on the website updates.
4. When you leave the Chess.com app, the board stays for 2 minutes, then goes away.

**If nothing shows up:** open Chess Relay while a game is on screen in Chess.com (switch to it and straight back). Look at **Board found on the Chess.com screen**. If it says "No game board with a clock on this screen" while a game is open, the app can't read the board the way Chess.com shows it. Tap **Copy what it read** and send that text to whoever is maintaining the app, so the reader can be adjusted.

## Good to know

- **How it reads:** Chess.com labels every square of the board for screen readers ("White Rook on h1"). The app reads those labels, so it sees the exact position, and which colour you're playing from which way round the board is. The website works out each move from one position to the next.
- **Only live games:** it only sends a board while a game clock is on screen, so puzzles and old games aren't sent. (Daily games without a clock won't show either.)
- **Picking up halfway:** if the app starts reading partway through a game, the website starts its board from that position.
- **Fair play:** Android allows apps like this for accessibility reasons. It only reads the screen and never touches the game. Even so, there's no promise that Chess.com's fair play checks will never flag it.
