## 2024-05-18 - Added ARIA labels to Dashboard Actions
**Learning:** Found an accessibility issue pattern where icon-only action buttons (Share, Preview, Edit, Delete) in the dashboard lacked semantic descriptions, making them inaccessible to screen readers.
**Action:** Always verify icon-only buttons have descriptive `aria-label`s, especially in mapped lists of interactive elements.
