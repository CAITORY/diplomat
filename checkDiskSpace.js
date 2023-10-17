const fs = require('fs');

function getDiskSpaceInfo(__dirname) {
    try {
        const diskInfo = fs.statSync(__dirname);
        const freeSpace = diskInfo.blocks * diskInfo.blksize;
        const totalSpace = diskInfo.blocks * diskInfo.blksize;
        const usedSpace = totalSpace - freeSpace;
        
        console.log("test", totalSpace, usedSpace)
        return {
            total: totalSpace,
            free: freeSpace,
            used: usedSpace
        };
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// 디스크 정보 확인
const diskInfo = getDiskSpaceInfo(__dirname); // 경로를 바꿔서 원하는 디스크 확인 가능

if (diskInfo) {
    console.log('Total disk space (bytes):', diskInfo.total);
    console.log('Free disk space (bytes):', diskInfo.free);
    console.log('Used disk space (bytes):', diskInfo.used);

    // GB로 변환
    const toGB = bytes => bytes / (1024 ** 3);
    console.log('Total disk space (GB):', toGB(diskInfo.total));
    console.log('Free disk space (GB):', toGB(diskInfo.free));
    console.log('Used disk space (GB):', toGB(diskInfo.used));
}