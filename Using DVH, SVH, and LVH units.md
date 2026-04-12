
When designing for the modern web, particularly for mobile devices, the traditional vh (Viewport Height) unit often fails because it doesn't account for browser interface elements like address bars and navigation tabs that slide in and out.

To solve this, CSS introduced Logical Viewport Units: svh, lvh, and dvh. Here is a breakdown of the best practices for using them.

The Mental Model: The Accordion Viewport
Think of a mobile browser window like an accordion folder.

SVH (Small Viewport Height): This represents the folder when it is most compressed. It is the viewport height when the browser's UI (address bar, etc.) is fully expanded and taking up the most space.

LVH (Large Viewport Height): This is the folder fully stretched out. It is the height when the browser's UI is collapsed (usually after the user starts scrolling).

DVH (Dynamic Viewport Height): This is the accordion in motion. It scales automatically between the small and large heights as the user scrolls and the UI adjusts.

When to Use Each Unit
1. Use dvh for Full-Screen Hero Sections
If you want a hero section or a landing page "fold" to always occupy exactly 100% of the visible screen, regardless of whether the address bar is visible, 100dvh is your best friend.

Why: It prevents that awkward "jump" or overflow where a 100vh container is taller than the visible space, forcing the user to scroll just to see the bottom of the first section.

2. Use svh for Fixed UI Elements
For elements that must never be covered by the browser's UI—such as bottom navigation bars, floating action buttons (FABs), or modals—svh is the safest bet.

Why: By sizing based on the "smallest" possible viewport, you guarantee that the element stays within the "safe zone" even when the browser chrome is fully expanded.

3. Use lvh for Immersive Backgrounds
lvh is best reserved for background images or videos where you want the media to cover the maximum possible area without resizing as the user scrolls.

Why: Using dvh for background images can cause "jitter" or performance lag because the browser has to recalculate and re-render the image size every time the address bar moves a pixel. lvh provides a stable, maximum-size container.

Unit,Browser UI State,Best Used For
svh,Fully Expanded (UI is visible),"Sidebars, sticky footers, modals."
lvh,Fully Collapsed (UI is hidden),"Background images, full-page video backgrounds."
dvh,Active/Changing,"Hero sections, ""Fill-the-screen"" layouts."