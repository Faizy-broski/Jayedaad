import { ScrollView, Text, View, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import RenderHTML from 'react-native-render-html';
import { useBlogPostViewModel } from '@jayedaad/core';
import { theme } from '@jayedaad/ui-native';
import type { RootStackParamList } from '../navigation/RootNavigator';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

// content is Super Admin-authored TipTap HTML — same trust level as any
// other admin-authored field rendered elsewhere in this app, not
// public-submitted, so rendering it directly is safe.
export function BlogDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'BlogDetail'>>();
  const { width } = useWindowDimensions();
  const { post, isLoading } = useBlogPostViewModel(route.params.slug);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <Text style={styles.loading}>Loading…</Text>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.notFound}>
          <Ionicons name="newspaper-outline" size={32} color={theme.colors.muted} />
          <Text style={styles.notFoundText}>Article not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {post.coverImageUrl && (
          <Image source={{ uri: post.coverImageUrl }} style={styles.cover} contentFit="cover" transition={150} />
        )}

        {post.category && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{post.category.name}</Text>
          </View>
        )}
        <Text style={styles.title}>{post.title}</Text>
        <View style={styles.metaRow}>
          {post.publishedAt && <Text style={styles.meta}>{formatDate(post.publishedAt)}</Text>}
          {post.publishedAt && post.readTime && <Text style={styles.meta}>·</Text>}
          {post.readTime && <Text style={styles.meta}>{post.readTime}</Text>}
        </View>

        <View style={styles.content}>
          <RenderHTML
            contentWidth={width - theme.spacing.lg * 2}
            source={{ html: post.content }}
            baseStyle={{ color: theme.colors.text, fontSize: 15, lineHeight: 23 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  loading: { textAlign: 'center', color: theme.colors.muted, marginTop: theme.spacing.xl },
  notFound: { alignItems: 'center', justifyContent: 'center', flex: 1, gap: theme.spacing.sm },
  notFoundText: { color: theme.colors.muted },
  scrollContent: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  cover: { width: '100%', height: 220, borderRadius: 16, marginBottom: theme.spacing.md },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: theme.spacing.sm,
  },
  tagText: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },
  title: { fontSize: 22, fontWeight: '700', color: theme.colors.text, lineHeight: 29 },
  metaRow: { flexDirection: 'row', gap: 6, marginTop: theme.spacing.sm },
  meta: { fontSize: 12, color: theme.colors.muted },
  content: { marginTop: theme.spacing.lg },
});
