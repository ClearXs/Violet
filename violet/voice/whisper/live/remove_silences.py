from violet.voice.whisper.live.timed_objects import ASRToken
import re

MIN_SILENCE_DURATION = 4  # in seconds
# in seconds. you should keep it important to not have false positive when the model lag is important
END_SILENCE_DURATION = 8
# VAC is good at detecting silences, but we want to skip the smallest silences
END_SILENCE_DURATION_VAC = 3


def blank_to_silence(tokens):
    full_string = ''.join([t.text for t in tokens])
    patterns = [re.compile(r'(?:\s*\[BLANK_AUDIO\]\s*)+'),
                re.compile(r'(?:\s*\[typing\]\s*)+')]
    matches = []
    for pattern in patterns:
        for m in pattern.finditer(full_string):
            matches.append({
                'start': m.start(),
                'end': m.end()
            })
    if matches:
        # cleaned = pattern.sub(' ', full_string).strip()
        # print("Cleaned:", cleaned)
        cumulated_len = 0
        silence_token = None
        cleaned_tokens = []
        for token in tokens:
            if matches:
                start = cumulated_len
                end = cumulated_len + len(token.text)
                cumulated_len = end
                if start >= matches[0]['start'] and end <= matches[0]['end']:
                    if silence_token:  # previous token was already silence
                        silence_token.start = min(
                            silence_token.start, token.start)
                        silence_token.end = max(silence_token.end, token.end)
                    else:  # new silence
                        silence_token = ASRToken(
                            start=token.start,
                            end=token.end,
                            speaker=-2,
                            probability=0.95
                        )
                else:
                    if silence_token:  # there was silence but no more
                        if silence_token.end - silence_token.start >= MIN_SILENCE_DURATION:
                            cleaned_tokens.append(
                                silence_token
                            )
                        silence_token = None
                        matches.pop(0)
                    cleaned_tokens.append(token)
        # print(cleaned_tokens)
        return cleaned_tokens
    return tokens


def no_token_to_silence(tokens):
    new_tokens = []
    silence_token = None
    for token in tokens:
        if token.speaker == -2:
            # if token is silence and previous one too
            if new_tokens and new_tokens[-1].speaker == -2:
                new_tokens[-1].end = token.end
            else:
                new_tokens.append(token)

        last_end = new_tokens[-1].end if new_tokens else 0.0
        if token.start - last_end >= MIN_SILENCE_DURATION:  # if token is not silence but important gap
            if new_tokens and new_tokens[-1].speaker == -2:
                new_tokens[-1].end = token.start
            else:
                silence_token = ASRToken(
                    start=last_end,
                    end=token.start,
                    speaker=-2,
                    probability=0.95
                )
                new_tokens.append(silence_token)

        if token.speaker != -2:
            new_tokens.append(token)
    return new_tokens


def ends_with_silence(tokens, buffer_transcription, buffer_diarization, current_time, vac_detected_silence):
    if not tokens:
        return [], buffer_transcription, buffer_diarization
    last_token = tokens[-1]
    if tokens and (
        current_time - last_token.end >= END_SILENCE_DURATION
        or
        (current_time - last_token.end >= 3 and vac_detected_silence)
    ):
        if last_token.speaker == -2:
            last_token.end = current_time
        else:
            tokens.append(
                ASRToken(
                    start=tokens[-1].end,
                    end=current_time,
                    speaker=-2,
                    probability=0.95
                )
            )
        # for whisperstreaming backend, we should probably validate the buffer has because of the silence
        buffer_transcription = ""
        buffer_diarization = ""
    return tokens, buffer_transcription, buffer_diarization


def handle_silences(tokens, buffer_transcription, buffer_diarization, current_time, vac_detected_silence):
    # useful for simulstreaming backend which tends to generate [BLANK_AUDIO] text
    tokens = blank_to_silence(tokens)
    tokens = no_token_to_silence(tokens)
    tokens, buffer_transcription, buffer_diarization = ends_with_silence(
        tokens, buffer_transcription, buffer_diarization, current_time, vac_detected_silence)
    return tokens, buffer_transcription, buffer_diarization
