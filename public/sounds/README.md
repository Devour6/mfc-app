# Sound Effects

This directory should contain the following audio files for the MFC app:

## Required Sound Files

- `punch-light.mp3` - Light punch/jab sound effect
- `punch-heavy.mp3` - Heavy punch/power shot sound effect  
- `dodge.mp3` - Fighter dodging/movement sound
- `block.mp3` - Successful block sound effect
- `ko.mp3` - Knockout impact sound
- `bell.mp3` - Round/fight end bell
- `crowd-cheer.mp3` - Crowd reaction for big moments
- `trade-success.mp3` - Successful trade confirmation
- `trade-fail.mp3` - Failed trade/error sound
- `notification.mp3` - General UI notification sound

## Audio Specifications

- Format: MP3 or WAV
- Duration: 0.5-2 seconds for most effects
- Volume: Normalized for consistent playback
- Quality: 44.1kHz, 16-bit minimum

## Sound Sources

For production, use royalty-free sound libraries such as:
- Zapsplat
- Freesound.org
- Adobe Stock Audio
- Epidemic Sound

## Notes

The app includes a comprehensive SoundManager that handles:
- Contextual sound playback based on fight actions
- Volume control and muting
- Sound effect layering for combo attacks
- Ambient crowd reactions based on fight intensity