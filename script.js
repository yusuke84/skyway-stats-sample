/* eslint-disable require-jsdoc */
$(function() {
    // Peer object
    const peer = new Peer({
        key:   window.__SKYWAY_KEY__,
        debug: 3,
    });

    let localStream;
    let existingCall;
    let timer;

    peer.on('open', () => {
        $('#my-id').text(peer.id);
        step1();
    });

    // Receiving a call
    peer.on('call', call => {
        // Answer the call automatically (instead of prompting user) for demo purposes
        call.answer(localStream, {
            // 発信側のコーデックを優先
            //videoCodec: $('#videoCodec').val()
        });
        step3(call);
    });

    peer.on('error', err => {
        alert(err.message);
        // Return to step 2 if error occurs
        step2();
    });

    $('#make-call').on('submit', e => {
        e.preventDefault();
        // Initiate a call!
        console.log($('#callto-id').val());
        const call = peer.call($('#callto-id').val(), localStream, {
            videoCodec: $('#videoCodec').val()
        });
        step3(call);
    });

    $('#end-call').on('click', () => {
        existingCall.close();
        clearInterval(timer);
        step2();
    });

    // Retry if getUserMedia fails
    $('#step1-retry').on('click', () => {
        $('#step1-error').hide();
        step1();
    });

    // Getting Stats 
    $('#getting-stats').on('click', () => {
        timer = setInterval(()=>{
            getRTCStats(existingCall._negotiator._pc.getStats())
        },1000);
        step4();
    });

    // Stop acquiring stats
    $('#stop-acquiring-stats').on('click', () => {
        clearInterval(timer);
        step5();
    });

    // set up audio and video input selectors
    const audioSelect = $('#audioSource');
    const videoSelect = $('#videoSource');
    const selectors = [audioSelect, videoSelect];

    navigator.mediaDevices.enumerateDevices()
        .then(deviceInfos => {
        const values = selectors.map(select => select.val() || '');
    selectors.forEach(select => {
        const children = select.children(':first');
    while (children.length) {
        select.remove(children);
    }
});

    for (let i = 0; i !== deviceInfos.length; ++i) {
        const deviceInfo = deviceInfos[i];
        const option = $('<option>').val(deviceInfo.deviceId);

        if (deviceInfo.kind === 'audioinput') {
            option.text(deviceInfo.label ||
                'Microphone ' + (audioSelect.children().length + 1));
            audioSelect.append(option);
        } else if (deviceInfo.kind === 'videoinput') {
            option.text(deviceInfo.label ||
                'Camera ' + (videoSelect.children().length + 1));
            videoSelect.append(option);
        }
    }

    selectors.forEach((select, selectorIndex) => {
        if (Array.prototype.slice.call(select.children()).some(n => {
        return n.value === values[selectorIndex];
})) {
        select.val(values[selectorIndex]);
    }
});

    videoSelect.on('change', step1);
    audioSelect.on('change', step1);
});

    function step1() {
        // Get audio/video stream
        const audioSource = $('#audioSource').val();
        const videoSource = $('#videoSource').val();
        const constraints = {
            audio: false,
            video: {deviceId: videoSource ? {exact: videoSource} : undefined},
        };

        navigator.mediaDevices.getUserMedia(constraints).then(stream => {
            $('#my-video').get(0).srcObject = stream;
        localStream = stream;

        if (existingCall) {
            existingCall.replaceStream(stream);
            return;
        }

        step2();
    }).catch(err => {
            $('#step1-error').show();
        console.error(err);
    });
    }

    function step2() {
        $('#step1, #step3').hide();
        $('#step2').show();
        $('#callto-id').focus();
        $('#getting-stats').show();
        $('#stop-acquiring-stats').hide();
        $('#local-candidate').text('');
        $('#remote-candidate').text('');
        $('#inbound-codec').text('');
        $('#outbound-codec').text('');
        $('#inbound-audio').text('');
        $('#inbound-video').text('');
        $('#outbound-audio').text('');
        $('#outbound-video').text('');
        $('#local-audio-video').text('');
        $('#remote-audio-video').text('');
    }

    function step3(call) {
        // Hang up on an existing call if present
        if (existingCall) {
            existingCall.close();
        }
        // Wait for stream on the call, then set peer video display
        call.on('stream', stream => {
            $('#their-video').get(0).srcObject = stream;
        });

        // UI stuff
        existingCall = call;
        $('#their-id').text(call.remoteId);
        call.on('close', step2);
        $('#step1, #step2').hide();
        $('#step3').show();
    }

    function step4() {
        $('#getting-stats').hide();
        $('#stop-acquiring-stats').show();
    }

    function step5() {
        $('#getting-stats').show();
        $('#stop-acquiring-stats').hide();
    }

    async function getRTCStats(statsObject){

        let trasportArray = [];
        let candidateArray = [];
        let candidatePairArray = [];
        let inboundRTPAudioStreamArray = [];
        let inboundRTPVideoStreamArray = [];
        let outboundRTPAudioStreamArray = [];
        let outboundRTPVideoStreamArray = [];
        let codecArray = [];
        let mediaStreamTrack_local_audioArray = [];
        let mediaStreamTrack_local_videoArray = [];
        let mediaStreamTrack_remote_audioArray = [];
        let mediaStreamTrack_remote_videoArray = [];
        let candidatePairId = '';
        let localCandidateId = '';
        let remoteCandidateId = '';
        let localCandidate = {};
        let remoteCandidate = {};
        let inboundAudioCodec = {};
        let inboundVideoCodec = {};
        let outboundAudioCode = {};
        let outboundVideoCode = {};

        let stats = await statsObject;
        stats.forEach(stat => {
            if(stat.id.indexOf('RTCTransport') !== -1){
                trasportArray.push(stat);
            }                
            if(stat.id.indexOf('RTCIceCandidatePair') !== -1){
                candidatePairArray.push(stat);
            }
            if(stat.id.indexOf('RTCIceCandidate_') !== -1){
                candidateArray.push(stat);
            }
            if(stat.id.indexOf('RTCInboundRTPAudioStream') !== -1){
                inboundRTPAudioStreamArray.push(stat);
            }
            if(stat.id.indexOf('RTCInboundRTPVideoStream') !== -1){
                inboundRTPVideoStreamArray.push(stat);
            }
            if(stat.id.indexOf('RTCOutboundRTPAudioStream') !== -1){
                outboundRTPAudioStreamArray.push(stat);
            }
            if(stat.id.indexOf('RTCOutboundRTPVideoStream') !== -1){
                outboundRTPVideoStreamArray.push(stat);
            }
            if(stat.id.indexOf('RTCMediaStreamTrack_local_audio') !== -1){
                mediaStreamTrack_local_audioArray.push(stat);
            }
            if(stat.id.indexOf('RTCMediaStreamTrack_local_video') !== -1){
                mediaStreamTrack_local_videoArray.push(stat);
            }
            if(stat.id.indexOf('RTCMediaStreamTrack_remote_audio') !== -1){
                mediaStreamTrack_remote_audioArray.push(stat);
            }
            if(stat.id.indexOf('RTCMediaStreamTrack_remote_video') !== -1){
                mediaStreamTrack_remote_videoArray.push(stat);
            }
            if(stat.id.indexOf('RTCCodec') !== -1){
                codecArray.push(stat);
            }
        });

        trasportArray.forEach(transport => {
            if(transport.dtlsState === 'connected'){
                candidatePairId = transport.selectedCandidatePairId;
            }
        });
        candidatePairArray.forEach(candidatePair => {
            if(candidatePair.state === 'succeeded' && candidatePair.id === candidatePairId){
                localCandidateId = candidatePair.localCandidateId;
                remoteCandidateId = candidatePair.remoteCandidateId;
            }
        });
        candidateArray.forEach(candidate => {
            if(candidate.id === localCandidateId){
                localCandidate = candidate;
            }
            if(candidate.id === remoteCandidateId){
                remoteCandidate = candidate;
            }
        });

        inboundRTPAudioStreamArray.forEach(inboundRTPAudioStream => {
            codecArray.forEach(codec => {
                if(inboundRTPAudioStream.codecId === codec.id){
                    inboundAudioCodec = codec;
                }
            });
        });
        inboundRTPVideoStreamArray.forEach(inboundRTPVideoStream => {
            codecArray.forEach(codec => {
                if(inboundRTPVideoStream.codecId === codec.id){
                    inboundVideoCodec = codec;
                }
            });
        });  
        outboundRTPAudioStreamArray.forEach(outboundRTPAudioStream => {
            codecArray.forEach(codec => {
                if(outboundRTPAudioStream.codecId === codec.id){
                    outboundAudioCodec = codec;
                }
            });
        });      
        outboundRTPVideoStreamArray.forEach(outboundRTPVideo => {
            codecArray.forEach(codec => {
                if(outboundRTPVideo.codecId === codec.id){
                    outboundVideoCodec = codec;
                }
            });
        });   

        $('#local-candidate').html(localCandidate.ip + ':' + localCandidate.port + '(' +localCandidate.protocol + ')' + '<BR>type:' + localCandidate.candidateType);
        $('#remote-candidate').html(remoteCandidate.ip + ':' + remoteCandidate.port + '(' +remoteCandidate.protocol + ')' + '<BR>type:' + remoteCandidate.candidateType);
        
        $('#inbound-codec').html(inboundVideoCodec.mimeType + '<BR>' + inboundAudioCodec.mimeType);
        $('#outbound-codec').html(outboundVideoCodec.mimeType + '<BR>' + outboundAudioCodec.mimeType)

        $('#inbound-audio').html('bytesReceived:' + inboundRTPAudioStreamArray[0].bytesReceived + '<BR>jitter:' + inboundRTPAudioStreamArray[0].jitter + '<BR>fractionLost:' + inboundRTPAudioStreamArray[0].fractionLost);
        $('#inbound-video').html('bytesReceived:' + inboundRTPVideoStreamArray[0].bytesReceived + '<BR>fractionLost:' + inboundRTPVideoStreamArray[0].fractionLost);
        
        $('#outbound-audio').html('bytesReceived:' + outboundRTPAudioStreamArray[0].bytesSent);
        $('#outbound-video').html('bytesReceived:' + outboundRTPVideoStreamArray[0].bytesSent);

        $('#local-audio-video').html('audioLevel:' + mediaStreamTrack_local_audioArray[0].audioLevel + '<BR>frameHeight:' + mediaStreamTrack_local_videoArray[0].frameHeight + '<BR>frameWidth:' + mediaStreamTrack_local_videoArray[0].frameWidth + '<BR>framesSent:' + mediaStreamTrack_local_videoArray[0].framesSent);
        $('#remote-audio-video').html('audioLevel:' + mediaStreamTrack_remote_audioArray[0].audioLevel + '<BR>frameHeight:' + mediaStreamTrack_local_videoArray[0].frameHeight + '<BR>frameWidth:' + mediaStreamTrack_remote_videoArray[0].frameWidth);

    }
});
