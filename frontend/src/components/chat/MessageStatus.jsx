import { memo } from 'react';

import { Check } from 'lucide-react';

const iconProps = {
  strokeWidth: 3,
};

const STATUS_CONFIG = {
  sent: {
    single: true,
    className:
      'text-slate-200',
  },

  delivered: {
    single: false,
    className:
      'text-slate-200',
  },

  seen: {
    single: false,
    className:
      'text-cyan-300',
  },
};

function MessageStatus({
  status,
}) {

  if (
    !status ||
    !STATUS_CONFIG[status]
  ) {

    return null;
  }

  const config =
    STATUS_CONFIG[status];

  return (
    <div className="ml-1 flex items-center justify-center">

      <Check
        size={12}
        {...iconProps}
        className={
          config.className
        }
      />

      {!config.single && (

        <Check
          size={12}
          {...iconProps}
          className={`-ml-1 ${config.className}`}
        />
      )}
    </div>
  );
}

export default memo(
  MessageStatus
);