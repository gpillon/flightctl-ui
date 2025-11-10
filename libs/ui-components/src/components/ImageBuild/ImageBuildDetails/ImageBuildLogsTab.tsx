import * as React from 'react';
import { CodeBlock, CodeBlockCode, Stack, StackItem, Title, Bullseye, Spinner } from '@patternfly/react-core';
import { ImageBuild, ImageBuildStatus } from '../useImageBuilds';
import { useTranslation } from '../../../hooks/useTranslation';
import { useFetchPeriodically } from '../../../hooks/useFetchPeriodically';

type ImageBuildLogsTabProps = {
  imageBuild: ImageBuild;
};

const ImageBuildLogsTab = ({ imageBuild }: ImageBuildLogsTabProps) => {
  const { t } = useTranslation();
  const buildId = imageBuild.metadata.name || '';
  const codeBlockRef = React.useRef<HTMLDivElement>(null);
  const previousLogsLengthRef = React.useRef<number>(0);
  const isUserAtBottomRef = React.useRef<boolean>(true);

  // Determine if build is in a final state (Failed or Completed)
  const isFinalState =
    imageBuild.status?.phase === ImageBuildStatus.FAILED ||
    imageBuild.status?.phase === ImageBuildStatus.COMPLETED;

  // Build is active if in one of these phases: Pending, Building, Pushing, GeneratingImages
  const isActivePhase =
    imageBuild.status?.phase === ImageBuildStatus.PENDING ||
    imageBuild.status?.phase === ImageBuildStatus.BUILDING ||
    imageBuild.status?.phase === ImageBuildStatus.PUSHING ||
    imageBuild.status?.phase === ImageBuildStatus.GENERATING_IMAGES;

  // If build is in final state, use logs from status; otherwise fetch from API
  const logsEndpoint = !isFinalState && isActivePhase && buildId ? `imagebuilds/${buildId}/logs` : '';
  const [logsData] = useFetchPeriodically<{ logs: string[] }>(
    logsEndpoint
      ? {
        endpoint: logsEndpoint,
        timeout: 2000, // Poll every 2 seconds when building
      }
      : { endpoint: '' },
    undefined,
  );

  // Use logs from status if available (for failed/completed builds), otherwise use fetched logs
  const logs = imageBuild.status?.logs || logsData?.logs || [];
  const allLogs = logs.join('\n');

  // Check if user is at the bottom of the log viewer
  const checkIfAtBottom = React.useCallback(() => {
    const element = codeBlockRef.current;
    if (!element) return false;

    const { scrollHeight, scrollTop, clientHeight } = element;
    // Consider "at bottom" if within 50px of the bottom
    return scrollHeight - scrollTop - clientHeight < 50;
  }, []);

  // Handle scroll events to track if user is at bottom
  React.useEffect(() => {
    const element = codeBlockRef.current;
    if (!element) return;

    const handleScroll = () => {
      isUserAtBottomRef.current = checkIfAtBottom();
    };

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [checkIfAtBottom]);

  // Auto-scroll to bottom when new logs arrive, if user was already at bottom
  React.useEffect(() => {
    const element = codeBlockRef.current;
    if (!element) return;

    // Check if we have new logs
    const currentLogsLength = logs.length;
    const hasNewLogs = currentLogsLength > previousLogsLengthRef.current;
    previousLogsLengthRef.current = currentLogsLength;

    // Auto-scroll only if there are new logs and user was at bottom
    if (hasNewLogs && isUserAtBottomRef.current) {
      element.scrollTop = element.scrollHeight;
    }
  }, [logs]);

  // Scroll to bottom on initial load
  React.useEffect(() => {
    const element = codeBlockRef.current;
    if (!element) return;

    // Small delay to ensure content is rendered
    const timer = setTimeout(() => {
      element.scrollTop = element.scrollHeight;
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="xl">
          {t('Build Logs')}
        </Title>
      </StackItem>

      <StackItem>
        {isActivePhase && !logsData ? (
          <Bullseye>
            <Spinner />
          </Bullseye>
        ) : logs.length > 0 ? (
          <div
            ref={codeBlockRef}
            style={{
              maxHeight: '600px',
              overflow: 'auto',
              border: '1px solid var(--pf-v5-global--BorderColor--100)',
              borderRadius: '4px',
            }}
          >
            <CodeBlock>
              <CodeBlockCode>{allLogs}</CodeBlockCode>
            </CodeBlock>
          </div>
        ) : (
          <div>{t('No logs available yet.')}</div>
        )}
      </StackItem>
    </Stack>
  );
};

export default ImageBuildLogsTab;

