import React from 'react';
import { render } from '@testing-library/react';
import RootLayout, { metadata, viewport } from './layout';

describe('RootLayout', () => {
  it('should export Next.js App Router metadata and viewport configuration', () => {
    expect(metadata.title).toBeDefined();
    expect(viewport).toBeDefined();
    expect(viewport).toMatchObject({
      width: 'device-width',
      initialScale: 1,
    });
  });

  it('should render children cleanly without manual head viewport tag', () => {
    const { getByText, container } = render(
      <RootLayout>
        <div>Content Inside Root Layout</div>
      </RootLayout>,
    );

    expect(getByText('Content Inside Root Layout')).toBeInTheDocument();
    // Verify no manual head is rendered inside body
    const headElements = container.querySelectorAll('head');
    expect(headElements.length).toBe(0);
  });
});
