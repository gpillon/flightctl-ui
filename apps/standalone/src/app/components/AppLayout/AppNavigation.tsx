import * as React from 'react';
import { Nav, NavList } from '@patternfly/react-core';

import { getAppRoutes } from '../../routes';

import NavItem from '@flightctl/ui-components/src/components/NavItem/NavItem';
import { useTranslation } from '@flightctl/ui-components/src/hooks/useTranslation';
import { useBuilderEnabled } from '@flightctl/ui-components/src/hooks/useBuilderEnabled';
import { useAppContext } from '@flightctl/ui-components/src/hooks/useAppContext';

const AppNavigation = () => {
  const { t } = useTranslation();
  const {
    router: { useLocation },
  } = useAppContext();
  const location = useLocation();
  
  // Only check builder status if we're on an imagebuilds route
  // For the menu, we default to showing it (true) until we know otherwise
  const shouldCheckBuilder = React.useMemo(() => {
    return location.pathname.includes('/imagebuilds');
  }, [location.pathname]);
  
  const builderEnabled = useBuilderEnabled(shouldCheckBuilder);
  
  // Default to true for menu display if we haven't checked yet
  // This ensures the menu item is visible until we confirm it's disabled
  const showBuilderInMenu = shouldCheckBuilder ? builderEnabled : true;
  
  return (
    <Nav id="flightclt-nav" theme="dark">
      <NavList id="flightclt-navlist" style={{ padding: 0 }}>
        {getAppRoutes(t, showBuilderInMenu)
          .filter((route) => route.showInNav)
          .map((route) => {
            return (
              <NavItem key={route.path} to={route.path || ''}>
                {route.title} {route.navContent}
              </NavItem>
            );
          })}
      </NavList>
    </Nav>
  );
};

export default AppNavigation;
