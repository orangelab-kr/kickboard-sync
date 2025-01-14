import {
  FranchisePermission,
  LocationPermission,
} from '@hikick/openapi-internal-sdk';
import { Handler } from 'aws-lambda';
import {
  firestore,
  InternalClient,
  InternalError,
  KickboardModel,
  logger,
  MongoDB,
} from '.';
import { Webhook } from './tools';

export * from './models';
export * from './tools';

export const handler: Handler = async () => {
  const startTime = Date.now();
  logger.info('시스템 / 시스템을 활성화하고 있습니다.');
  const [kickboardDocs, kickboards, regionId, franchiseId] = await Promise.all([
    firestore.collection('kick').orderBy('last_update', 'desc').get(),
    KickboardModel.find(),
    getRegionId(),
    getFranchiseId(),
    MongoDB.init(),
  ]);

  logger.info(
    `킥보드 / 파이어베이스 킥보드 갯수는 총 ${kickboardDocs.size}개 입니다.`
  );

  logger.info(
    `킥보드 / 몽고디비 킥보드 갯수는 총 ${kickboards.length}개 입니다.`
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
        logger.warn(`킥보드 / ${displayName} 올바르지 않은 킥보드 코드입니다.`);
        return;
      }

      if (duplicateCode.includes(kickboardCode)) {
        logger.warn(`킥보드 / ${displayName} 이미 처리된 킥보드 코드입니다.`);
        return;
      }

      duplicateCode.push(kickboardCode);
      const kickboard = kickboards.find(
        (e) => e.kickboardCode === kickboardCode
      );

      if (kickboard) {
        if (kickboard.kickboardId !== kickboardId) {
          kickboard.kickboardId = kickboardId;
          const changed = kickboard.kickboardId + ' -> ' + kickboardId;
          logger.info(
            `킥보드 / ${displayName} 킥보드의 IMEI 값이 변경되었습니다. (${changed})`
          );

          await Webhook.send(
            `킥보드 / ${displayName} 킥보드의 IMEI 값이 변경되었습니다. (${changed})`
          );
        }

        if (!kickboard.franchiseId) kickboard.franchiseId = franchiseId;
        if (!kickboard.regionId) kickboard.regionId = regionId;
        await kickboard.save();
        return;
      }

      logger.info(`킥보드 / ${displayName} 킥보드를 생성하였습니다.`);
      await KickboardModel.create({
        kickboardId,
        kickboardCode,
        franchiseId,
        regionId,
        lost: null,
        helmetId: null,
        maxSpeed: null,
        collect: null,
        disconnectedAt: null,
      });

      await Webhook.send(`킥보드 / ${displayName} 킥보드를 생성하였습니다.`);
    };
  });

  while (functions.length)
    await Promise.all(functions.splice(0, 50).map((f) => f()));
  const processTime = `${(Date.now() - startTime).toLocaleString()}ms`;
  logger.info(`시스템 / 시스템 처리가 완료되었습니다. ${processTime}`);
};

async function getFranchiseId(): Promise<string> {
  const franchiseClient = InternalClient.getFranchise([
    FranchisePermission.FRANCHISE_LIST,
  ]);

  const franchise = await franchiseClient
    .getFranchises({ take: 1, search: '미지정' })
    .then((e) => e.franchises[0]);

  if (!franchise) {
    throw new InternalError('미지정 프렌차이즈를 찾을 수 없습니다.');
  }

  const { franchiseId } = franchise;
  logger.info(`프렌차이즈 / 기본 프렌차이즈 ID: ${franchiseId}`);
  return franchiseId;
}

async function getRegionId(): Promise<string> {
  const locationClient = InternalClient.getLocation([
    LocationPermission.LOCATION_REGION_LIST,
  ]);

  const region = await locationClient
    .getRegions({ take: 1, search: '미운영' })
    .then((e) => e.regions[0]);

  if (!region) {
    throw new InternalError('기본 미운영 지역을 찾을 수 없습니다.');
  }

  const { regionId } = region;
  logger.info(`프렌차이즈 / 기본 미운영 지역 ID: ${regionId}`);
  return regionId;
}
