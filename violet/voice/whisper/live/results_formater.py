
import logging
from datetime import timedelta
from violet.voice.whisper.live.remove_silences import handle_silences

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

PUNCTUATION_MARKS = {'.', '!', '?'}
CHECK_AROUND = 4


def format_time(seconds: float) -> str:
    """Format seconds as HH:MM:SS."""
    return str(timedelta(seconds=int(seconds)))


def is_punctuation(token):
    if token.text.strip() in PUNCTUATION_MARKS:
        return True
    return False


def next_punctuation_change(i, tokens):
    for ind in range(i+1, min(len(tokens), i+CHECK_AROUND+1)):
        if is_punctuation(tokens[ind]):
            return ind
    return None


def next_speaker_change(i, tokens, speaker):
    for ind in range(i-1, max(0, i-CHECK_AROUND)-1, -1):
        token = tokens[ind]
        if is_punctuation(token):
            break
        if token.speaker != speaker:
            return ind, token.speaker
    return None, speaker


def new_line(
    token,
    speaker,
    last_end_diarized,
    debug_info=""
):
    return {
        "speaker": int(speaker),
        "text": token.text + debug_info,
        "beg": format_time(token.start),
        "end": format_time(token.end),
        "diff": round(token.end - last_end_diarized, 2)
    }


def append_token_to_last_line(lines, sep, token, debug_info, last_end_diarized):
    if token.text:
        lines[-1]["text"] += sep + token.text + debug_info
        lines[-1]["end"] = format_time(token.end)
        lines[-1]["diff"] = round(token.end - last_end_diarized, 2)


def format_output(state, silence, current_time, diarization, debug):
    tokens = state["tokens"]
    buffer_transcription = state["buffer_transcription"]
    buffer_diarization = state["buffer_diarization"]
    end_attributed_speaker = state["end_attributed_speaker"]
    sep = state["sep"]

    previous_speaker = -1
    lines = []
    last_end_diarized = 0
    undiarized_text = []
    tokens, buffer_transcription, buffer_diarization = handle_silences(
        tokens, buffer_transcription, buffer_diarization, current_time, silence)
    last_punctuation = None
    for i, token in enumerate(tokens):
        speaker = token.speaker

        if not diarization and speaker == -1:  # Speaker -1 means no attributed by diarization. In the frontend, it should appear under 'Speaker 1'
            speaker = 1
        if diarization and not tokens[-1].speaker == -2:
            if (speaker in [-1, 0]) and token.end >= end_attributed_speaker:
                undiarized_text.append(token.text)
                continue
            elif (speaker in [-1, 0]) and token.end < end_attributed_speaker:
                speaker = previous_speaker
            if speaker not in [-1, 0]:
                last_end_diarized = max(token.end, last_end_diarized)

        debug_info = ""
        if debug:
            debug_info = f"[{format_time(token.start)} : {format_time(token.end)}]"

        if not lines:
            lines.append(
                new_line(token, speaker, last_end_diarized, debug_info=""))
            continue
        else:
            previous_speaker = lines[-1]['speaker']

        if is_punctuation(token):
            last_punctuation = i

        if last_punctuation == i-1:
            if speaker != previous_speaker:
                # perfect, diarization perfectly aligned
                lines.append(
                    new_line(token, speaker, last_end_diarized, debug_info=""))
                last_punctuation, next_punctuation = None, None
                continue

            speaker_change_pos, new_speaker = next_speaker_change(
                i, tokens, speaker)
            if speaker_change_pos:
                # Corrects delay:
                # That was the idea. Okay haha |SPLIT SPEAKER| that's a good one
                # should become:
                # That was the idea. |SPLIT SPEAKER| Okay haha that's a good one
                lines.append(new_line(token, new_speaker,
                             last_end_diarized, debug_info=""))
            else:
                # No speaker change to come
                append_token_to_last_line(
                    lines, sep, token, debug_info, last_end_diarized)
            continue

        if speaker != previous_speaker:
            if speaker == -2 or previous_speaker == -2:  # silences can happen anytime
                lines.append(
                    new_line(token, speaker, last_end_diarized, debug_info=""))
                continue
            elif next_punctuation_change(i, tokens):
                # Corrects advance:
                # Are you |SPLIT SPEAKER| okay? yeah, sure. Absolutely
                # should become:
                # Are you okay? |SPLIT SPEAKER| yeah, sure. Absolutely
                append_token_to_last_line(
                    lines, sep, token, debug_info, last_end_diarized)
                continue
            else:  # we create a new speaker, but that's no ideal. We are not sure about the split. We prefer to append to previous line
                # lines.append(new_line(token, speaker, last_end_diarized, debug_info = ""))
                pass

        append_token_to_last_line(
            lines, sep, token, debug_info, last_end_diarized)
    return lines, undiarized_text, buffer_transcription, ''
