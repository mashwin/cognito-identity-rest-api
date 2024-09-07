import { CognitoJwtVerifier } from "aws-jwt-verify";

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: "access",
  clientId: process.env.COGNITO_CLIENT_ID,
});

export const handler = async (event, context) => {
  // extract token from Authorization header
  const token = event.headers.Authorization
    ? event.headers.Authorization.split(" ")[1]
    : null;

  if (!token) {
    return generatePolicy("user", "Deny", event.methodArn);
  }

  try {
    const payload = await verifier.verify(token);

    const policy = generatePolicy(payload.sub, "Allow", event.methodArn, {
      userId: payload.sub,
    });

    return policy;
  } catch (error) {
    return generatePolicy("user", "Deny", event.methodArn);
  }
};

const generatePolicy = (principalId, effect, resource, context) => {
  const authResponse = {
    principalId,
  };

  if (effect && resource) {
    const policyDocument = {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    };

    authResponse.policyDocument = policyDocument;
    if (context) {
      authResponse.context = context;
    }
  }

  return authResponse;
};
