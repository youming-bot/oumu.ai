import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AudioPlayer from '../../../src/components/audio-player';

// Mock dependencies
jest.mock('@/components/ui/button', () => {
  return function MockButton({ children, onClick, disabled, variant, size, className, ...props }) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={className}
        data-variant={variant}
        data-size={size}
        {...props}
      >
        {children}
      </button>
    );
  };
});

jest.mock('@/components/ui/slider', () => {
  return function MockSlider({ value, max, step, onValueChange, className }) {
    return (
      <input
        type="range"
        value={value[0]}
        max={max}
        step={step}
        onChange={(e) => onValueChange([parseFloat(e.target.value)])}
        className={className}
        data-testid="slider"
      />
    );
  };
});

jest.mock('@/components/ui/card', () => {
  return function MockCard({ children, className }) {
    return <div className={className}>{children}</div>;
  };
});

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }) => <div>{children}</div>,
  Tooltip: ({ children }) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }) => asChild ? children : <div>{children}</div>,
  TooltipContent: ({ children }) => <div>{children}</div>,
}));

jest.mock('@/components/waveform-display', () => {
  return function MockWaveformDisplay({ audioUrl, currentTime, duration, onSeek, height, showProgress, color, progressColor }) {
    return (
      <div
        data-testid="waveform-display"
        data-audio-url={audioUrl}
        data-current-time={currentTime}
        data-duration={duration}
        data-height={height}
        data-show-progress={showProgress}
        data-color={color}
        data-progress-color={progressColor}
        onClick={() => onSeek && onSeek(30)} // Mock seek to 30 seconds
      >
        Waveform Display
      </div>
    );
  };
});

// Mock icons
jest.mock('lucide-react', () => ({
  Play: () => <div data-testid="play-icon">Play</div>,
  Pause: () => <div data-testid="pause-icon">Pause</div>,
  SkipBack: () => <div data-testid="skip-back-icon">SkipBack</div>,
  SkipForward: () => <div data-testid="skip-forward-icon">SkipForward</div>,
  Volume2: () => <div data-testid="volume-icon">Volume2</div>,
  VolumeX: () => <div data-testid="volume-x-icon">VolumeX</div>,
  Repeat: () => <div data-testid="repeat-icon">Repeat</div>,
  Square: () => <div data-testid="square-icon">Square</div>,
}));

describe('AudioPlayer Component', () => {
  const defaultProps = {
    audioUrl: 'http://example.com/audio.mp3',
    currentTime: 0,
    duration: 180, // 3 minutes
    isPlaying: false,
    onPlay: jest.fn(),
    onPause: jest.fn(),
    onSeek: jest.fn(),
    onSkipBack: jest.fn(),
    onSkipForward: jest.fn(),
    onSetLoop: jest.fn(),
    onClearLoop: jest.fn(),
    title: 'Test Audio File',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render audio player with title', () => {
      render(<AudioPlayer {...defaultProps} />);

      expect(screen.getByText('Test Audio File')).toBeInTheDocument();
      expect(screen.getByTestId('waveform-display')).toBeInTheDocument();
    });

    it('should render waveform display with correct props', () => {
      render(<AudioPlayer {...defaultProps} currentTime={30} />);

      const waveform = screen.getByTestId('waveform-display');
      expect(waveform).toHaveAttribute('data-audio-url', 'http://example.com/audio.mp3');
      expect(waveform).toHaveAttribute('data-current-time', '30');
      expect(waveform).toHaveAttribute('data-duration', '180');
      expect(waveform).toHaveAttribute('data-height', '60');
      expect(waveform).toHaveAttribute('data-show-progress', 'true');
      expect(waveform).toHaveAttribute('data-color', '#3b82f6');
      expect(waveform).toHaveAttribute('data-progress-color', '#10b981');
    });

    it('should render progress slider with correct value', () => {
      render(<AudioPlayer {...defaultProps} currentTime={60} duration={180} />);

      const progressSlider = screen.getAllByTestId('slider')[0];
      expect(progressSlider).toHaveValue(33.333333333333336); // (60/180)*100
    });

    it('should display formatted time correctly', () => {
      render(<AudioPlayer {...defaultProps} currentTime={75} duration={195} />);

      expect(screen.getByText('1:15')).toBeInTheDocument(); // 75 seconds
      expect(screen.getByText('3:15')).toBeInTheDocument(); // 195 seconds
    });

    it('should render without waveform when no audioUrl', () => {
      render(<AudioPlayer {...defaultProps} audioUrl={undefined} />);

      expect(screen.queryByTestId('waveform-display')).not.toBeInTheDocument();
    });
  });

  describe('Play/Pause Controls', () => {
    it('should show play button when not playing', () => {
      render(<AudioPlayer {...defaultProps} isPlaying={false} />);

      expect(screen.getByTestId('play-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('pause-icon')).not.toBeInTheDocument();
    });

    it('should show pause button when playing', () => {
      render(<AudioPlayer {...defaultProps} isPlaying={true} />);

      expect(screen.getByTestId('pause-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('play-icon')).not.toBeInTheDocument();
    });

    it('should call onPlay when play button is clicked', async () => {
      const user = userEvent.setup();
      render(<AudioPlayer {...defaultProps} isPlaying={false} />);

      const playButton = screen.getByTestId('play-icon').closest('button');
      await user.click(playButton);

      expect(defaultProps.onPlay).toHaveBeenCalledTimes(1);
    });

    it('should call onPause when pause button is clicked', async () => {
      const user = userEvent.setup();
      render(<AudioPlayer {...defaultProps} isPlaying={true} />);

      const pauseButton = screen.getByTestId('pause-icon').closest('button');
      await user.click(pauseButton);

      expect(defaultProps.onPause).toHaveBeenCalledTimes(1);
    });

    it('should disable play button when no audio URL', () => {
      render(<AudioPlayer {...defaultProps} audioUrl={undefined} />);

      const playButton = screen.getByTestId('play-icon').closest('button');
      expect(playButton).toBeDisabled();
    });
  });

  describe('Skip Controls', () => {
    it('should render skip back and forward buttons', () => {
      render(<AudioPlayer {...defaultProps} />);

      expect(screen.getByTestId('skip-back-icon')).toBeInTheDocument();
      expect(screen.getByTestId('skip-forward-icon')).toBeInTheDocument();
    });

    it('should call onSkipBack when skip back button is clicked', async () => {
      const user = userEvent.setup();
      render(<AudioPlayer {...defaultProps} />);

      const skipBackButton = screen.getByTestId('skip-back-icon').closest('button');
      await user.click(skipBackButton);

      expect(defaultProps.onSkipBack).toHaveBeenCalledTimes(1);
    });

    it('should call onSkipForward when skip forward button is clicked', async () => {
      const user = userEvent.setup();
      render(<AudioPlayer {...defaultProps} />);

      const skipForwardButton = screen.getByTestId('skip-forward-icon').closest('button');
      await user.click(skipForwardButton);

      expect(defaultProps.onSkipForward).toHaveBeenCalledTimes(1);
    });

    it('should disable skip buttons when handlers not provided', () => {
      render(<AudioPlayer {...defaultProps} onSkipBack={undefined} onSkipForward={undefined} />);

      const skipBackButton = screen.getByTestId('skip-back-icon').closest('button');
      const skipForwardButton = screen.getByTestId('skip-forward-icon').closest('button');

      expect(skipBackButton).toBeDisabled();
      expect(skipForwardButton).toBeDisabled();
    });
  });

  describe('Progress Control', () => {
    it('should call onSeek when progress slider is changed', async () => {
      const user = userEvent.setup();
      render(<AudioPlayer {...defaultProps} duration={180} />);

      const progressSlider = screen.getAllByTestId('slider')[0];
      await user.clear(progressSlider);
      await user.type(progressSlider, '50'); // 50% of 180 seconds = 90 seconds

      expect(defaultProps.onSeek).toHaveBeenCalledWith(90);
    });

    it('should not call onSeek when duration is 0', async () => {
      const user = userEvent.setup();
      render(<AudioPlayer {...defaultProps} duration={0} />);

      const progressSlider = screen.getAllByTestId('slider')[0];
      await user.clear(progressSlider);
      await user.type(progressSlider, '50');

      expect(defaultProps.onSeek).not.toHaveBeenCalled();
    });

    it('should handle waveform seek', async () => {
      const user = userEvent.setup();
      render(<AudioPlayer {...defaultProps} />);

      const waveform = screen.getByTestId('waveform-display');
      await user.click(waveform);

      expect(defaultProps.onSeek).toHaveBeenCalledWith(30); // Mock seek value
    });
  });

  describe('Volume Control', () => {
    it('should render volume control with slider', () => {
      render(<AudioPlayer {...defaultProps} />);

      expect(screen.getByTestId('volume-icon')).toBeInTheDocument();
      expect(screen.getAllByTestId('slider')).toHaveLength(2); // Progress + Volume
    });

    it('should toggle mute when volume button is clicked', async () => {
      const user = userEvent.setup();
      render(<AudioPlayer {...defaultProps} />);

      const volumeButton = screen.getByTestId('volume-icon').closest('button');
      await user.click(volumeButton);

      // Should show mute icon after clicking
      await waitFor(() => {
        expect(screen.getByTestId('volume-x-icon')).toBeInTheDocument();
      });
    });

    it('should update volume when slider is changed', async () => {
      const user = userEvent.setup();
      render(<AudioPlayer {...defaultProps} />);

      const volumeSlider = screen.getAllByTestId('slider')[1]; // Second slider is volume
      await user.clear(volumeSlider);
      await user.type(volumeSlider, '0.5');

      // Volume should be updated (tested through component state)
      expect(volumeSlider).toHaveValue(0.5);
    });

    it('should show mute icon when volume is 0', async () => {
      const user = userEvent.setup();
      render(<AudioPlayer {...defaultProps} />);

      const volumeSlider = screen.getAllByTestId('slider')[1];
      await user.clear(volumeSlider);
      await user.type(volumeSlider, '0');

      await waitFor(() => {
        expect(screen.getByTestId('volume-x-icon')).toBeInTheDocument();
      });
    });
  });

  describe('Loop Controls', () => {
    it('should render loop controls when handlers provided', () => {
      render(<AudioPlayer {...defaultProps} />);

      expect(screen.getByTestId('repeat-icon')).toBeInTheDocument();
    });

    it('should not render loop controls when handlers not provided', () => {
      render(<AudioPlayer {...defaultProps} onSetLoop={undefined} onClearLoop={undefined} />);

      expect(screen.queryByTestId('repeat-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('square-icon')).not.toBeInTheDocument();
    });

    it('should call onSetLoop when loop button is clicked and no loop exists', async () => {
      const user = userEvent.setup();
      render(<AudioPlayer {...defaultProps} currentTime={30} />);

      const loopButton = screen.getByTestId('repeat-icon').closest('button');
      await user.click(loopButton);

      expect(defaultProps.onSetLoop).toHaveBeenCalledWith(30, 40); // currentTime, currentTime + 10
    });

    it('should call onClearLoop when loop button is clicked and loop exists', async () => {
      const user = userEvent.setup();
      render(<AudioPlayer {...defaultProps} loopStart={30} loopEnd={40} />);

      const loopButton = screen.getByTestId('square-icon').closest('button');
      await user.click(loopButton);

      expect(defaultProps.onClearLoop).toHaveBeenCalledTimes(1);
    });

    it('should display loop range when loop is active', () => {
      render(<AudioPlayer {...defaultProps} loopStart={30} loopEnd={50} />);

      expect(screen.getByText('0:30-0:50')).toBeInTheDocument();
      expect(screen.getByTestId('square-icon')).toBeInTheDocument();
    });

    it('should show secondary variant for loop button when loop is active', () => {
      render(<AudioPlayer {...defaultProps} loopStart={30} loopEnd={40} />);

      const loopButton = screen.getByTestId('square-icon').closest('button');
      expect(loopButton).toHaveAttribute('data-variant', 'secondary');
    });
  });

  describe('Time Formatting', () => {
    it('should format seconds correctly', () => {
      render(<AudioPlayer {...defaultProps} currentTime={0} duration={59} />);
      expect(screen.getByText('0:00')).toBeInTheDocument();
      expect(screen.getByText('0:59')).toBeInTheDocument();
    });

    it('should format minutes correctly', () => {
      render(<AudioPlayer {...defaultProps} currentTime={60} duration={125} />);
      expect(screen.getByText('1:00')).toBeInTheDocument();
      expect(screen.getByText('2:05')).toBeInTheDocument();
    });

    it('should pad seconds with zero', () => {
      render(<AudioPlayer {...defaultProps} currentTime={65} duration={605} />);
      expect(screen.getByText('1:05')).toBeInTheDocument();
      expect(screen.getByText('10:05')).toBeInTheDocument();
    });
  });

  describe('Audio Element', () => {
    it('should render audio element when audioUrl is provided', () => {
      render(<AudioPlayer {...defaultProps} />);

      const audioElement = screen.getByRole('application', { hidden: true });
      expect(audioElement).toHaveAttribute('src', 'http://example.com/audio.mp3');
    });

    it('should not render audio element when no audioUrl', () => {
      render(<AudioPlayer {...defaultProps} audioUrl={undefined} />);

      expect(screen.queryByRole('application', { hidden: true })).not.toBeInTheDocument();
    });

    it('should handle audio timeupdate event', () => {
      render(<AudioPlayer {...defaultProps} />);

      const audioElement = screen.getByRole('application', { hidden: true });

      // Mock audio currentTime
      Object.defineProperty(audioElement, 'currentTime', { value: 45, writable: true });

      fireEvent.timeUpdate(audioElement);

      expect(defaultProps.onSeek).toHaveBeenCalledWith(45);
    });

    it('should handle audio ended event', () => {
      render(<AudioPlayer {...defaultProps} />);

      const audioElement = screen.getByRole('application', { hidden: true });
      fireEvent.ended(audioElement);

      expect(defaultProps.onPause).toHaveBeenCalledTimes(1);
    });
  });

  describe('Default Props', () => {
    it('should work with minimal props', () => {
      render(<AudioPlayer />);

      expect(screen.getByText('Audio Player')).toBeInTheDocument(); // Default title
      expect(screen.getByText('0:00')).toBeInTheDocument(); // Default times
    });

    it('should handle undefined callbacks gracefully', async () => {
      const user = userEvent.setup();
      render(<AudioPlayer audioUrl="test.mp3" />);

      const playButton = screen.getByTestId('play-icon').closest('button');

      // Should not throw error when clicking
      await user.click(playButton);
      expect(playButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate button roles and labels', () => {
      render(<AudioPlayer {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Check that buttons exist for main controls
      expect(screen.getByTestId('play-icon').closest('button')).toBeInTheDocument();
      expect(screen.getByTestId('skip-back-icon').closest('button')).toBeInTheDocument();
      expect(screen.getByTestId('skip-forward-icon').closest('button')).toBeInTheDocument();
      expect(screen.getByTestId('volume-icon').closest('button')).toBeInTheDocument();
    });

    it('should have proper slider controls', () => {
      render(<AudioPlayer {...defaultProps} />);

      const sliders = screen.getAllByTestId('slider');
      expect(sliders).toHaveLength(2); // Progress and volume sliders

      sliders.forEach(slider => {
        expect(slider).toHaveAttribute('type', 'range');
      });
    });
  });
});