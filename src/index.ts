import { Handler } from 'aws-lambda';
import { FranchisePermission, LocationPermission } from 'openapi-internal-sdk';
import {
  firestore,
  InternalClient,
  InternalError,
  KickboardMode,
  KickboardModel,
  logger,
  MongoDB,
} from '.';
import { Webhook } from './tools';

export * from './models';
export * from './tools';

export const handler: Handler = async (event, context) => {
  const startTime = Date.now();
  logger.info('[시스템] 시스템을 활성화하고 있습니다.');
  const [kickboardDocs, kickboards, regionId, franchiseId] = await Promise.all([
    firestore.collection('kick').orderBy('last_update', 'desc').get(),
    KickboardModel.find(),
    getRegionId(),
    getFranchiseId(),
    MongoDB.init(),
  ]);

  logger.info(
    `[킥보드] 파이어베이스 킥보드 갯수는 총 ${kickboardDocs.size}개 입니다.`
  );

  logger.info(
    `[킥보드] 몽고디비 킥보드 갯수는 총 ${kickboards.length}개 입니다.`
  );

  const duplicateCode: string[] = [];
  const functions = kickboardDocs.docs.map((kickboardDoc) => {
    return async () => {
      const {
        id: kickboardId,
        code: kickboardCode,
        can_ride: canRide,
        deploy,
      } = kickboardDoc.data();
      const displayName = `${kickboardCode}(${kickboardId})`;
      if (kickboardCode.length !== 6) {
        logger.warn(`[킥보드] ${displayName} 올바르지 않은 킥보드 코드입니다.`);
        return;
      }

      if (duplicateCode.includes(kickboardCode)) {
        logger.warn(`[킥보드] ${displayName} 이미 처리된 킥보드 코드입니다.`);
        return;
      }

      duplicateCode.push(kickboardCode);
      const kickboard = await kickboards.find(
        (e) => e.kickboardCode === kickboardCode
      );

      let mode = KickboardMode.READY;
      if (!canRide) mode = KickboardMode.INUSE;
      if (!deploy) mode = KickboardMode.COLLECTED;
      if (kickboard) {
        const bypassMode = [
          KickboardMode.UNREGISTERED,
          KickboardMode.BROKEN,
          KickboardMode.DISABLED,
        ];

        if (kickboard.mode === mode || bypassMode.includes(kickboard.mode))
          return;

        const changed =
          KickboardMode[kickboard.mode] + ' -> ' + KickboardMode[mode];
        logger.info(
          `[킥보드] ${displayName} 이미 존재하여 상태만 변경하였습니다. (${changed})`
        );

        kickboard.mode = mode;
        await kickboard.save();
        return;
      }

      await KickboardModel.create({
        kickboardId,
        kickboardCode,
        franchiseId,
        regionId,
        mode,
        lost: null,
        helmetId: null,
        maxSpeed: null,
        collect: null,
        disconnectedAt: null,
      });

      logger.info(`[킥보드] ${displayName} 킥보드를 생성하였습니다.`);
      await Webhook.send(
        `[파이어베이스 싱크] ${displayName} 킥보드를 생성하였습니다.`
      );
    };
  });

  while (functions.length)
    await Promise.all(functions.splice(0, 50).map((f) => f()));
  const processTime = `${(Date.now() - startTime).toLocaleString()}ms`;
  logger.info(`[시스템] 시스템 처리가 완료되었습니다. ${processTime}`);
};

async function getFranchiseId(): Promise<string> {
  const franchiseClient = InternalClient.getFranchise([
    FranchisePermission.FRANCHISES_LIST,
  ]);

  const franchise = await franchiseClient
    .getFranchises({ take: 1, search: '본사' })
    .then((e) => e.franchises[0]);

  if (!franchise) {
    throw new InternalError('본사 프렌차이즈를 찾을 수 없습니다.');
  }

  const { franchiseId } = franchise;
  logger.info(`[프렌차이즈] 기본 프렌차이즈 ID: ${franchiseId}`);
  return franchiseId;
}

async function getRegionId(): Promise<string> {
  const locationClient = InternalClient.getLocation([
    LocationPermission.REGIONS_LIST,
  ]);

  const region = await locationClient
    .getRegions({ take: 1, search: '미운영' })
    .then((e) => e.regions[0]);

  if (!region) {
    throw new InternalError('기본 미운영 지역을 찾을 수 없습니다.');
  }

  const { regionId } = region;
  logger.info(`[프렌차이즈] 기본 미운영 지역 ID: ${regionId}`);
  return regionId;
}
